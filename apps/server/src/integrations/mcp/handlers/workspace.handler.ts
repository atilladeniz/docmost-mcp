import { Injectable, Logger } from '@nestjs/common';
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
import { UserService } from '../../../core/user/user.service';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB } from '@docmost/db/types/kysely.types';

/**
 * Handler for workspace-related MCP operations
 */
@Injectable()
export class WorkspaceHandler {
  private readonly logger = new Logger(WorkspaceHandler.name);

  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceAbility: WorkspaceAbilityFactory,
    private readonly userService: UserService,
    @InjectKysely() private readonly db: KyselyDB,
  ) {}

  /**
   * Handles workspace.get operation
   *
   * @param params The operation parameters
   * @param userId The ID of the user making the request
   * @returns The workspace details
   */
  async getWorkspace(params: any, userId: string): Promise<any> {
    this.logger.debug(`Processing workspace.get operation for user ${userId}`);

    if (!params.workspaceId) {
      throw createInvalidParamsError('workspaceId is required');
    }

    try {
      // Get the workspace
      const workspace = await this.workspaceService.getWorkspaceInfo(
        params.workspaceId,
      );

      if (!workspace) {
        throw createResourceNotFoundError('Workspace', params.workspaceId);
      }

      // Get the user to check permissions
      const authUser = await this.userService.findById(
        userId,
        params.workspaceId,
      );

      if (!authUser) {
        throw createPermissionDeniedError(
          'User not found in the specified workspace',
        );
      }

      return workspace;
    } catch (error: any) {
      this.logger.error(
        `Error getting workspace: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      if (error?.code && typeof error.code === 'number') {
        throw error; // Re-throw MCP errors
      }
      throw createInternalError(error?.message || String(error));
    }
  }

  /**
   * Handles workspace.list operation
   *
   * @param params The operation parameters
   * @param userId The ID of the user making the request
   * @returns List of workspaces the user has access to
   */
  async listWorkspaces(params: any, userId: string): Promise<any> {
    this.logger.debug(`Processing workspace.list operation for user ${userId}`);

    try {
      // Get the workspaces the user is a member of directly from the database
      // In most cases, this will be a single workspace
      const userWorkspaces = await this.db
        .selectFrom('users')
        .innerJoin('workspaces', 'users.workspaceId', 'workspaces.id')
        .select([
          'workspaces.id',
          'workspaces.name',
          'workspaces.description',
          'workspaces.hostname',
          'workspaces.logo',
          'workspaces.createdAt',
          'workspaces.updatedAt',
        ])
        .where('users.id', '=', userId)
        .where('users.deletedAt', 'is', null)
        .execute();

      return {
        workspaces: userWorkspaces,
        pagination: {
          limit: userWorkspaces.length,
          page: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    } catch (error: any) {
      this.logger.error(
        `Error listing workspaces: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      if (error?.code && typeof error.code === 'number') {
        throw error; // Re-throw MCP errors
      }
      throw createInternalError(error?.message || String(error));
    }
  }

  /**
   * Handles workspace.update operation
   *
   * @param params The operation parameters
   * @param userId The ID of the user making the request
   * @returns The updated workspace details
   */
  async updateWorkspace(params: any, userId: string): Promise<any> {
    this.logger.debug(
      `Processing workspace.update operation for user ${userId}`,
    );

    if (!params.workspaceId) {
      throw createInvalidParamsError('workspaceId is required');
    }

    try {
      // Get the workspace first to check if it exists
      const workspace = await this.workspaceService.findById(
        params.workspaceId,
      );

      if (!workspace) {
        throw createResourceNotFoundError('Workspace', params.workspaceId);
      }

      // Get the user to check permissions
      const authUser = await this.userService.findById(
        userId,
        params.workspaceId,
      );

      if (!authUser) {
        throw createPermissionDeniedError(
          'User not found in the specified workspace',
        );
      }

      // Check if user has permission to update workspace settings
      const ability = this.workspaceAbility.createForUser(authUser, workspace);
      if (
        ability.cannot(
          WorkspaceCaslAction.Manage,
          WorkspaceCaslSubject.Settings,
        )
      ) {
        throw createPermissionDeniedError(
          'You do not have permission to update workspace settings',
        );
      }

      // Create update DTO from params, removing workspaceId
      const { workspaceId, ...updateWorkspaceDto } = params;

      // Update the workspace
      const updatedWorkspace = await this.workspaceService.update(
        workspaceId,
        updateWorkspaceDto,
      );

      return updatedWorkspace;
    } catch (error: any) {
      this.logger.error(
        `Error updating workspace: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      if (error?.code && typeof error.code === 'number') {
        throw error; // Re-throw MCP errors
      }
      throw createInternalError(error?.message || String(error));
    }
  }
}
