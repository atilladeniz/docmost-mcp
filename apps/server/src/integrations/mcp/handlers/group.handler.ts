import { Injectable, Logger } from '@nestjs/common';
import { GroupService } from '../../../core/group/services/group.service';
import { WorkspaceService } from '../../../core/workspace/services/workspace.service';
import { User } from '@docmost/db/types/entity.types';
import { PaginationOptions } from '@docmost/db/pagination/pagination-options';
import {
  createInvalidParamsError,
  createInternalError,
  createPermissionDeniedError,
  createResourceNotFoundError,
} from '../utils/error.utils';
import WorkspaceAbilityFactory from '../../../core/casl/abilities/workspace-ability.factory';
import {
  WorkspaceCaslAction,
  WorkspaceCaslSubject,
} from '../../../core/casl/interfaces/workspace-ability.type';

/**
 * Handler for group-related MCP operations
 */
@Injectable()
export class GroupHandler {
  private readonly logger = new Logger(GroupHandler.name);

  constructor(
    private readonly groupService: GroupService,
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceAbility: WorkspaceAbilityFactory,
  ) {}

  /**
   * Handles group.list operation
   *
   * @param params The operation parameters
   * @param userId The ID of the user making the request
   * @returns List of groups in the workspace
   */
  async listGroups(params: any, userId: string): Promise<any> {
    this.logger.debug(`Processing group.list operation for user ${userId}`);

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

      // Create user object for ability check
      const user = { id: userId } as User;

      // Check user has permission to list groups
      const ability = this.workspaceAbility.createForUser(user, workspace);
      if (
        ability.cannot(WorkspaceCaslAction.Read, WorkspaceCaslSubject.Group)
      ) {
        throw createPermissionDeniedError(
          'You do not have permission to list groups in this workspace',
        );
      }

      // Get optional parameters with defaults
      const limit = params.limit || 50;
      const page = params.page || 1;

      // Create pagination options
      const paginationOptions = new PaginationOptions();
      paginationOptions.limit = limit;
      paginationOptions.page = page;
      paginationOptions.query = params.query || '';

      // Get groups in the workspace
      const groupsResult = await this.groupService.getWorkspaceGroups(
        params.workspaceId,
        paginationOptions,
      );

      return {
        groups: groupsResult.items,
        pagination: {
          limit,
          page,
          hasNextPage: groupsResult.meta?.hasNextPage,
          hasPrevPage: groupsResult.meta?.hasPrevPage,
        },
      };
    } catch (error: any) {
      this.logger.error(
        `Error listing groups: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      if (error?.code && typeof error.code === 'number') {
        throw error; // Re-throw MCP errors
      }
      throw createInternalError(error?.message || String(error));
    }
  }

  /**
   * Handles group.get operation
   *
   * @param params The operation parameters
   * @param userId The ID of the user making the request
   * @returns The group details
   */
  async getGroup(params: any, userId: string): Promise<any> {
    this.logger.debug(`Processing group.get operation for user ${userId}`);

    if (!params.groupId) {
      throw createInvalidParamsError('groupId is required');
    }

    if (!params.workspaceId) {
      throw createInvalidParamsError('workspaceId is required');
    }

    try {
      // Create user object for ability check
      const user = { id: userId } as User;

      // Get the workspace
      const workspace = await this.workspaceService.findById(
        params.workspaceId,
      );

      if (!workspace) {
        throw createResourceNotFoundError('Workspace', params.workspaceId);
      }

      // Check user has permission to view the group
      const ability = this.workspaceAbility.createForUser(user, workspace);
      if (
        ability.cannot(WorkspaceCaslAction.Read, WorkspaceCaslSubject.Group)
      ) {
        throw createPermissionDeniedError(
          'You do not have permission to view this group',
        );
      }

      // Get the group
      const group = await this.groupService.getGroupInfo(
        params.groupId,
        params.workspaceId,
      );

      return group;
    } catch (error: any) {
      this.logger.error(
        `Error getting group: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      if (error?.code && typeof error.code === 'number') {
        throw error; // Re-throw MCP errors
      }
      throw createInternalError(error?.message || String(error));
    }
  }
}
