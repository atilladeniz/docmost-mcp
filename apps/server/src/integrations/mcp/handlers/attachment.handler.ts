import { Injectable, Logger } from '@nestjs/common';
import { AttachmentService } from '../../../core/attachment/services/attachment.service';
import { WorkspaceService } from '../../../core/workspace/services/workspace.service';
import { PaginationOptions } from '@docmost/db/pagination/pagination-options';
import {
  createInvalidParamsError,
  createPermissionDeniedError,
  createResourceNotFoundError,
} from '../utils/error.utils';
import WorkspaceAbilityFactory from '../../../core/casl/abilities/workspace-ability.factory';
import SpaceAbilityFactory from '../../../core/casl/abilities/space-ability.factory';
import {
  WorkspaceCaslAction,
  WorkspaceCaslSubject,
} from '../../../core/casl/interfaces/workspace-ability.type';
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from '../../../core/casl/interfaces/space-ability.type';
import { validate as isValidUUID } from 'uuid';
import { User } from '@docmost/db/types/entity.types';
import { UserService } from '../../../core/user/user.service';

/**
 * Handler for attachment-related MCP operations
 */
@Injectable()
export class AttachmentHandler {
  private readonly logger = new Logger(AttachmentHandler.name);

  constructor(
    private readonly attachmentService: AttachmentService,
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceAbility: WorkspaceAbilityFactory,
    private readonly spaceAbility: SpaceAbilityFactory,
    private readonly userService: UserService,
  ) {}

  /**
   * Handles attachment.list operation
   *
   * @param params The operation parameters
   * @param userId The ID of the user making the request
   * @returns List of attachments
   */
  async listAttachments(params: any, userId: string): Promise<any> {
    this.logger.debug(
      `Processing attachment.list operation for user ${userId}`,
    );

    if (!params.workspaceId) {
      throw createInvalidParamsError('workspaceId is required');
    }

    try {
      // Get the workspace
      const workspace = await this.workspaceService.findById(
        params.workspaceId,
      );

      if (!workspace) {
        throw createResourceNotFoundError('Workspace', params.workspaceId);
      }

      // Get the user making the request
      const user = await this.userService.findById(userId, params.workspaceId);

      if (!user) {
        throw createPermissionDeniedError('User not found in this workspace');
      }

      // Check permissions based on what's being requested
      if (params.spaceId) {
        // If a specific space is requested, check space permissions
        if (!isValidUUID(params.spaceId)) {
          throw createInvalidParamsError('Invalid spaceId format');
        }

        const spaceAbility = await this.spaceAbility.createForUser(
          user,
          params.spaceId,
        );

        if (spaceAbility.cannot(SpaceCaslAction.Read, SpaceCaslSubject.Page)) {
          throw createPermissionDeniedError(
            'You do not have access to this space',
          );
        }
      } else {
        // If no space specified, check general workspace permissions
        const ability = this.workspaceAbility.createForUser(user, workspace);

        if (
          ability.cannot(
            WorkspaceCaslAction.Read,
            WorkspaceCaslSubject.Attachment,
          )
        ) {
          throw createPermissionDeniedError(
            'You do not have access to view attachments',
          );
        }
      }

      // Validate pageId if provided
      if (params.pageId && !isValidUUID(params.pageId)) {
        throw createInvalidParamsError('Invalid pageId format');
      }

      // Create pagination options
      const paginationOptions = new PaginationOptions();
      paginationOptions.page = params.page || 1;
      paginationOptions.limit = params.limit || 20;

      if (params.query) {
        paginationOptions.query = params.query;
      }

      // Get attachments
      const attachmentsResult = await this.attachmentService.getAttachments(
        {
          workspaceId: params.workspaceId,
          spaceId: params.spaceId,
          pageId: params.pageId,
          type: params.type,
        },
        paginationOptions,
      );

      return {
        attachments: attachmentsResult.items,
        pagination: {
          limit: paginationOptions.limit,
          page: paginationOptions.page,
          hasNextPage: attachmentsResult.meta?.hasNextPage,
          hasPrevPage: attachmentsResult.meta?.hasPrevPage,
        },
      };
    } catch (error: any) {
      this.logger.error(
        `Error listing attachments: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      if (error?.code && typeof error.code === 'number') {
        throw error; // Re-throw MCP errors
      }
      throw error;
    }
  }

  /**
   * Handles attachment.get operation
   *
   * @param params The operation parameters
   * @param userId The ID of the user making the request
   * @returns The attachment details
   */
  async getAttachment(params: any, userId: string): Promise<any> {
    this.logger.debug(`Processing attachment.get operation for user ${userId}`);

    // TODO: Implement getAttachment

    throw createInvalidParamsError('Not yet implemented');
  }
}
