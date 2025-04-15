import { Injectable, Logger } from '@nestjs/common';
import { SpaceService } from '../../../core/space/services/space.service';
import { SpaceMemberService } from '../../../core/space/services/space-member.service';
import { User } from '@docmost/db/types/entity.types';
import { PaginationOptions } from '@docmost/db/pagination/pagination-options';
import {
  createInvalidParamsError,
  createInternalError,
  createPermissionDeniedError,
  createResourceNotFoundError,
} from '../utils/error.utils';
import { WorkspaceService } from '../../../core/workspace/services/workspace.service';
import SpaceAbilityFactory from '../../../core/casl/abilities/space-ability.factory';
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from '../../../core/casl/interfaces/space-ability.type';
import { UserService } from '../../../core/user/user.service';

/**
 * Handler for space-related MCP operations
 */
@Injectable()
export class SpaceHandler {
  private readonly logger = new Logger(SpaceHandler.name);

  constructor(
    private readonly spaceService: SpaceService,
    private readonly spaceMemberService: SpaceMemberService,
    private readonly workspaceService: WorkspaceService,
    private readonly spaceAbility: SpaceAbilityFactory,
    private readonly userService: UserService,
  ) {}

  /**
   * Handles space.list operation
   *
   * @param params The operation parameters
   * @param userId The ID of the user making the request
   * @returns List of spaces the user has access to
   */
  async listSpaces(params: any, userId: string): Promise<any> {
    this.logger.debug(`Processing space.list operation for user ${userId}`);

    try {
      // Get optional parameters with defaults
      const limit = params.limit || 50;
      const page = params.page || 1;

      // Create pagination options
      const paginationOptions = new PaginationOptions();
      paginationOptions.limit = limit;
      paginationOptions.page = page;
      paginationOptions.query = params.query || '';

      // Get spaces for the user
      const spacesResult = await this.spaceMemberService.getUserSpaces(
        userId,
        paginationOptions,
      );

      return {
        spaces: spacesResult.items,
        pagination: {
          limit,
          page,
          hasNextPage: spacesResult.meta?.hasNextPage,
          hasPrevPage: spacesResult.meta?.hasPrevPage,
        },
      };
    } catch (error: any) {
      this.logger.error(
        `Error listing spaces: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      if (error?.code && typeof error.code === 'number') {
        throw error; // Re-throw MCP errors
      }
      throw createInternalError(error?.message || String(error));
    }
  }

  /**
   * Handles space.get operation
   *
   * @param params The operation parameters
   * @param userId The ID of the user making the request
   * @returns The space details
   */
  async getSpace(params: any, userId: string): Promise<any> {
    this.logger.debug(`Processing space.get operation for user ${userId}`);

    if (!params.spaceId) {
      throw createInvalidParamsError('spaceId is required');
    }

    if (!params.workspaceId) {
      throw createInvalidParamsError('workspaceId is required');
    }

    try {
      // Get the space
      const space = await this.spaceService.getSpaceInfo(
        params.spaceId,
        params.workspaceId,
      );

      if (!space) {
        throw createResourceNotFoundError('Space', params.spaceId);
      }

      return space;
    } catch (error: any) {
      this.logger.error(
        `Error getting space: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      if (error?.code && typeof error.code === 'number') {
        throw error; // Re-throw MCP errors
      }
      throw createInternalError(error?.message || String(error));
    }
  }

  /**
   * Handles space.create operation
   *
   * @param params The operation parameters
   * @param userId The ID of the user making the request
   * @returns The created space details
   */
  async createSpace(params: any, userId: string): Promise<any> {
    this.logger.debug(`Processing space.create operation for user ${userId}`);

    if (!params.workspaceId) {
      throw createInvalidParamsError('workspaceId is required');
    }

    if (!params.name) {
      throw createInvalidParamsError('name is required');
    }

    try {
      // Get workspace to verify it exists
      const workspace = await this.workspaceService.findById(
        params.workspaceId,
      );

      if (!workspace) {
        throw createResourceNotFoundError('Workspace', params.workspaceId);
      }

      // Create a user object with the necessary fields for createSpace
      const authUser = await this.userService.findById(
        userId,
        params.workspaceId,
      );

      if (!authUser) {
        throw createPermissionDeniedError(
          'User not found in the specified workspace',
        );
      }

      // Create a space with the provided data
      const createSpaceDto = {
        name: params.name,
        slug: params.slug || params.name.toLowerCase().replace(/\s+/g, '-'),
        description: params.description || '',
      };

      // Create the space
      const space = await this.spaceService.createSpace(
        authUser,
        params.workspaceId,
        createSpaceDto,
      );

      return space;
    } catch (error: any) {
      this.logger.error(
        `Error creating space: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      if (error?.code && typeof error.code === 'number') {
        throw error; // Re-throw MCP errors
      }
      throw createInternalError(error?.message || String(error));
    }
  }

  /**
   * Handles space.update operation
   *
   * @param params The operation parameters
   * @param userId The ID of the user making the request
   * @returns The updated space details
   */
  async updateSpace(params: any, userId: string): Promise<any> {
    this.logger.debug(`Processing space.update operation for user ${userId}`);

    if (!params.spaceId) {
      throw createInvalidParamsError('spaceId is required');
    }

    if (!params.workspaceId) {
      throw createInvalidParamsError('workspaceId is required');
    }

    try {
      // Get the user from the database
      const authUser = await this.userService.findById(
        userId,
        params.workspaceId,
      );

      if (!authUser) {
        throw createPermissionDeniedError(
          'User not found in the specified workspace',
        );
      }

      // Check permissions
      const ability = await this.spaceAbility.createForUser(
        authUser,
        params.spaceId,
      );
      if (ability.cannot(SpaceCaslAction.Manage, SpaceCaslSubject.Settings)) {
        throw createPermissionDeniedError(
          'You do not have permission to update this space',
        );
      }

      // Prepare the update data
      const updateSpaceDto = {
        spaceId: params.spaceId,
        name: params.name,
        description: params.description,
        slug: params.slug,
      };

      // Update the space
      const space = await this.spaceService.updateSpace(
        updateSpaceDto,
        params.workspaceId,
      );

      return space;
    } catch (error: any) {
      this.logger.error(
        `Error updating space: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      if (error?.code && typeof error.code === 'number') {
        throw error; // Re-throw MCP errors
      }
      throw createInternalError(error?.message || String(error));
    }
  }

  /**
   * Handles space.delete operation
   *
   * @param params The operation parameters
   * @param userId The ID of the user making the request
   * @returns Success indication
   */
  async deleteSpace(params: any, userId: string): Promise<any> {
    this.logger.debug(`Processing space.delete operation for user ${userId}`);

    if (!params.spaceId) {
      throw createInvalidParamsError('spaceId is required');
    }

    if (!params.workspaceId) {
      throw createInvalidParamsError('workspaceId is required');
    }

    try {
      // Get the user from the database
      const authUser = await this.userService.findById(
        userId,
        params.workspaceId,
      );

      if (!authUser) {
        throw createPermissionDeniedError(
          'User not found in the specified workspace',
        );
      }

      // Check permissions
      const ability = await this.spaceAbility.createForUser(
        authUser,
        params.spaceId,
      );
      if (ability.cannot(SpaceCaslAction.Manage, SpaceCaslSubject.Settings)) {
        throw createPermissionDeniedError(
          'You do not have permission to delete this space',
        );
      }

      // Delete the space
      await this.spaceService.deleteSpace(params.spaceId, params.workspaceId);

      return { success: true, message: 'Space deleted successfully' };
    } catch (error: any) {
      this.logger.error(
        `Error deleting space: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      if (error?.code && typeof error.code === 'number') {
        throw error; // Re-throw MCP errors
      }
      throw createInternalError(error?.message || String(error));
    }
  }

  /**
   * Handles space.updatePermissions operation
   *
   * @param params The operation parameters
   * @param userId The ID of the user making the request
   * @returns Success indication
   */
  async updatePermissions(params: any, userId: string): Promise<any> {
    this.logger.debug(
      `Processing space.updatePermissions operation for user ${userId}`,
    );

    if (!params.spaceId) {
      throw createInvalidParamsError('spaceId is required');
    }

    if (!params.workspaceId) {
      throw createInvalidParamsError('workspaceId is required');
    }

    if (!params.targetId) {
      throw createInvalidParamsError(
        'targetId (userId or groupId) is required',
      );
    }

    if (!params.role) {
      throw createInvalidParamsError('role is required');
    }

    try {
      // Get the user from the database
      const authUser = await this.userService.findById(
        userId,
        params.workspaceId,
      );

      if (!authUser) {
        throw createPermissionDeniedError(
          'User not found in the specified workspace',
        );
      }

      // Check permissions
      const ability = await this.spaceAbility.createForUser(
        authUser,
        params.spaceId,
      );

      if (ability.cannot(SpaceCaslAction.Manage, SpaceCaslSubject.Member)) {
        throw createPermissionDeniedError(
          'You do not have permission to manage members in this space',
        );
      }

      // Create dto for the update operation
      const updateRoleDto: any = {
        spaceId: params.spaceId,
        role: params.role,
      };

      // Check if we're updating a user or group
      if (params.isGroup) {
        updateRoleDto.groupId = params.targetId;
      } else {
        updateRoleDto.userId = params.targetId;
      }

      // Update the member's role
      await this.spaceMemberService.updateSpaceMemberRole(
        updateRoleDto,
        params.workspaceId,
      );

      return {
        success: true,
        message: `Space permissions updated successfully for ${params.isGroup ? 'group' : 'user'} ${params.targetId}`,
      };
    } catch (error: any) {
      this.logger.error(
        `Error updating space permissions: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      if (error?.code && typeof error.code === 'number') {
        throw error; // Re-throw MCP errors
      }
      throw createInternalError(error?.message || String(error));
    }
  }
}
