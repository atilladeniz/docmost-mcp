import { Injectable, Logger } from '@nestjs/common';
import { WorkspaceService } from '../../../core/workspace/services/workspace.service';
import { UserService } from '../../../core/user/user.service';
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
 * Handler for user-related MCP operations
 */
@Injectable()
export class UserHandler {
  private readonly logger = new Logger(UserHandler.name);

  constructor(
    private readonly userService: UserService,
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceAbility: WorkspaceAbilityFactory,
  ) {}

  /**
   * Handles user.list operation
   *
   * @param params The operation parameters
   * @param userId The ID of the user making the request
   * @returns List of users in the workspace
   */
  async listUsers(params: any, userId: string): Promise<any> {
    this.logger.debug(`Processing user.list operation for user ${userId}`);

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

      // Check user has permission to list users
      const ability = this.workspaceAbility.createForUser(user, workspace);
      if (
        ability.cannot(WorkspaceCaslAction.Read, WorkspaceCaslSubject.Member)
      ) {
        throw createPermissionDeniedError(
          'You do not have permission to list users in this workspace',
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

      // Get users in the workspace
      const usersResult = await this.userService.getWorkspaceUsers(
        params.workspaceId,
        paginationOptions,
      );

      return {
        users: usersResult.items,
        pagination: {
          limit,
          page,
          hasNextPage: usersResult.meta?.hasNextPage,
          hasPrevPage: usersResult.meta?.hasPrevPage,
        },
      };
    } catch (error: any) {
      this.logger.error(
        `Error listing users: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      if (error?.code && typeof error.code === 'number') {
        throw error; // Re-throw MCP errors
      }
      throw createInternalError(error?.message || String(error));
    }
  }

  /**
   * Handles user.get operation
   *
   * @param params The operation parameters
   * @param userId The ID of the user making the request
   * @returns The user details
   */
  async getUser(params: any, userId: string): Promise<any> {
    this.logger.debug(`Processing user.get operation for user ${userId}`);

    if (!params.userId) {
      throw createInvalidParamsError('userId is required');
    }

    if (!params.workspaceId) {
      throw createInvalidParamsError('workspaceId is required');
    }

    try {
      // Get the workspace to validate it exists
      const workspace = await this.workspaceService.findById(
        params.workspaceId,
      );

      if (!workspace) {
        throw createResourceNotFoundError('Workspace', params.workspaceId);
      }

      // Get the user
      const user = await this.userService.findById(
        params.userId,
        params.workspaceId,
      );

      if (!user) {
        throw createResourceNotFoundError('User', params.userId);
      }

      return user;
    } catch (error: any) {
      this.logger.error(
        `Error getting user: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      if (error?.code && typeof error.code === 'number') {
        throw error; // Re-throw MCP errors
      }
      throw createInternalError(error?.message || String(error));
    }
  }

  /**
   * Handles user.update operation
   *
   * @param params The operation parameters
   * @param userId The ID of the user making the request
   * @returns The updated user details
   */
  async updateUser(params: any, userId: string): Promise<any> {
    this.logger.debug(`Processing user.update operation for user ${userId}`);

    if (!params.userId) {
      throw createInvalidParamsError('userId is required');
    }

    if (!params.workspaceId) {
      throw createInvalidParamsError('workspaceId is required');
    }

    try {
      // Get the workspace to validate it exists
      const workspace = await this.workspaceService.findById(
        params.workspaceId,
      );

      if (!workspace) {
        throw createResourceNotFoundError('Workspace', params.workspaceId);
      }

      // Get the user who is making the request
      const authUser = await this.userService.findById(
        userId,
        params.workspaceId,
      );

      if (!authUser) {
        throw createPermissionDeniedError(
          'You do not have permission to perform this action',
        );
      }

      // Check if the user has the permission to update users
      const ability = this.workspaceAbility.createForUser(authUser, workspace);

      // Users can update their own profile
      const isUpdatingSelf = userId === params.userId;

      // Admin check is only needed if we're not updating our own profile
      if (
        !isUpdatingSelf &&
        ability.cannot(WorkspaceCaslAction.Edit, WorkspaceCaslSubject.Member)
      ) {
        throw createPermissionDeniedError(
          'You do not have permission to update this user',
        );
      }

      // Extract update data from params
      const updateUserDto: any = {};

      // Only allow certain fields to be updated
      if (params.name !== undefined) {
        updateUserDto.name = params.name;
      }

      if (params.email !== undefined && isUpdatingSelf) {
        updateUserDto.email = params.email;
      }

      if (params.avatarUrl !== undefined) {
        updateUserDto.avatarUrl = params.avatarUrl;
      }

      if (params.locale !== undefined) {
        updateUserDto.locale = params.locale;
      }

      if (params.fullPageWidth !== undefined) {
        updateUserDto.fullPageWidth = params.fullPageWidth;
      }

      // Admin users can update user roles
      if (
        params.role !== undefined &&
        ability.can(WorkspaceCaslAction.Manage, WorkspaceCaslSubject.Member)
      ) {
        updateUserDto.role = params.role;
      }

      // Only update if there are actually fields to update
      if (Object.keys(updateUserDto).length === 0) {
        throw createInvalidParamsError(
          'No valid fields to update were provided',
        );
      }

      // Update the user
      const updatedUser = await this.userService.update(
        updateUserDto,
        params.userId,
        params.workspaceId,
      );

      return updatedUser;
    } catch (error: any) {
      this.logger.error(
        `Error updating user: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      if (error?.code && typeof error.code === 'number') {
        throw error; // Re-throw MCP errors
      }
      throw createInternalError(error?.message || String(error));
    }
  }
}
