import { Injectable, Logger } from '@nestjs/common';
import { MCPRequest, MCPResponse, MCPError } from './interfaces/mcp.interface';
import { PageHandler } from './handlers/page.handler';
import { SpaceHandler } from './handlers/space.handler';
import { UserHandler } from './handlers/user.handler';
import { GroupHandler } from './handlers/group.handler';
import { WorkspaceHandler } from './handlers/workspace.handler';
import { AttachmentHandler } from './handlers/attachment.handler';
import { CommentHandler } from './handlers/comment.handler';
import { SystemHandler } from './handlers/system.handler';
import { ContextHandler } from './handlers/context.handler';
import { User } from '@docmost/db/types/entity.types';
import {
  createInternalError,
  createInvalidRequestError,
  createMethodNotFoundError,
  createParseError,
} from './utils/error.utils';

/**
 * Machine Control Protocol (MCP) Service
 *
 * This service is responsible for processing MCP requests and generating
 * appropriate responses. It serves as the central point for handling
 * all MCP operations.
 */
@Injectable()
export class MCPService {
  private readonly logger = new Logger(MCPService.name);

  constructor(
    private readonly pageHandler: PageHandler,
    private readonly spaceHandler: SpaceHandler,
    private readonly userHandler: UserHandler,
    private readonly groupHandler: GroupHandler,
    private readonly workspaceHandler: WorkspaceHandler,
    private readonly attachmentHandler: AttachmentHandler,
    private readonly commentHandler: CommentHandler,
    private readonly systemHandler: SystemHandler,
    private readonly contextHandler: ContextHandler,
  ) {}

  /**
   * Process an MCP request and generate a response
   *
   * @param request The incoming MCP request
   * @param user The authenticated user
   * @returns The MCP response
   */
  async processRequest(request: MCPRequest, user: User): Promise<MCPResponse> {
    this.logger.debug(
      `MCPService: Processing request ${request.method} from user ${user.email}`,
    );

    try {
      this.validateRequest(request);

      const [resource, operation] = request.method.split('.');
      this.logger.debug(
        `MCPService: Request for resource '${resource}', operation '${operation}'`,
      );

      let result: any;

      switch (resource) {
        case 'page':
          this.logger.debug(`MCPService: Delegating to page handler`);
          result = await this.handlePageRequest(
            operation,
            request.params,
            user.id,
          );
          break;
        case 'space':
          this.logger.debug(`MCPService: Delegating to space handler`);
          result = await this.handleSpaceRequest(
            operation,
            request.params,
            user.id,
          );
          break;
        case 'user':
          this.logger.debug(`MCPService: Delegating to user handler`);
          result = await this.handleUserRequest(
            operation,
            request.params,
            user.id,
          );
          break;
        case 'group':
          this.logger.debug(`MCPService: Delegating to group handler`);
          result = await this.handleGroupRequest(
            operation,
            request.params,
            user.id,
          );
          break;
        case 'workspace':
          this.logger.debug(`MCPService: Delegating to workspace handler`);
          result = await this.handleWorkspaceRequest(
            operation,
            request.params,
            user.id,
          );
          break;
        case 'attachment':
          this.logger.debug(`MCPService: Delegating to attachment handler`);
          result = await this.handleAttachmentRequest(
            operation,
            request.params,
            user.id,
          );
          break;
        case 'comment':
          this.logger.debug(`MCPService: Delegating to comment handler`);
          result = await this.handleCommentRequest(
            operation,
            request.params,
            user.id,
          );
          break;
        case 'system':
          this.logger.debug(`MCPService: Delegating to system handler`);
          result = await this.handleSystemRequest(operation, request.params);
          break;
        case 'context':
          this.logger.debug(`MCPService: Delegating to context handler`);
          result = await this.handleContextRequest(
            operation,
            request.params,
            user.id,
          );
          break;
        default:
          this.logger.warn(`MCPService: Unsupported resource '${resource}'`);
          throw createMethodNotFoundError(request.method);
      }

      this.logger.debug(
        `MCPService: Request ${request.id} completed successfully`,
      );

      return {
        jsonrpc: '2.0',
        result,
        id: request.id,
      };
    } catch (error: any) {
      this.logger.error(
        `MCPService: Error in processRequest - ${error.message || 'Unknown error'}`,
        error.stack,
      );

      // Return a properly formatted JSON-RPC error response
      return this.handleError(error, request.id);
    }
  }

  /**
   * Handle page-related requests
   *
   * @param operation The operation to perform
   * @param params The operation parameters
   * @param userId The ID of the authenticated user
   * @returns The operation result
   */
  private async handlePageRequest(
    operation: string,
    params: any,
    userId: string,
  ): Promise<any> {
    switch (operation) {
      case 'get':
        return this.pageHandler.getPage(params, userId);
      case 'list':
        return this.pageHandler.listPages(params, userId);
      case 'create':
        return this.pageHandler.createPage(params, userId);
      case 'update':
        return this.pageHandler.updatePage(params, userId);
      case 'delete':
        return this.pageHandler.deletePage(params, userId);
      case 'move':
        return this.pageHandler.movePage(params, userId);
      case 'search':
        return this.pageHandler.searchPages(params, userId);
      case 'getHistory':
        return this.pageHandler.getPageHistory(params, userId);
      case 'restore':
        return this.pageHandler.restorePageVersion(params, userId);
      default:
        throw createMethodNotFoundError(`page.${operation}`);
    }
  }

  /**
   * Handle space-related requests
   *
   * @param operation The operation to perform
   * @param params The operation parameters
   * @param userId The ID of the authenticated user
   * @returns The operation result
   */
  private async handleSpaceRequest(
    operation: string,
    params: any,
    userId: string,
  ): Promise<any> {
    switch (operation) {
      case 'get':
        return this.spaceHandler.getSpace(params, userId);
      case 'list':
        return this.spaceHandler.listSpaces(params, userId);
      case 'create':
        return this.spaceHandler.createSpace(params, userId);
      case 'update':
        return this.spaceHandler.updateSpace(params, userId);
      case 'delete':
        return this.spaceHandler.deleteSpace(params, userId);
      case 'updatePermissions':
        return this.spaceHandler.updatePermissions(params, userId);
      default:
        throw createMethodNotFoundError(`space.${operation}`);
    }
  }

  /**
   * Handle user-related requests
   *
   * @param operation The operation to perform
   * @param params The operation parameters
   * @param userId The ID of the authenticated user
   * @returns The operation result
   */
  private async handleUserRequest(
    operation: string,
    params: any,
    userId: string,
  ): Promise<any> {
    switch (operation) {
      case 'get':
        return this.userHandler.getUser(params, userId);
      case 'list':
        return this.userHandler.listUsers(params, userId);
      case 'update':
        return this.userHandler.updateUser(params, userId);
      default:
        throw createMethodNotFoundError(`user.${operation}`);
    }
  }

  /**
   * Handle group-related requests
   *
   * @param operation The operation to perform
   * @param params The operation parameters
   * @param userId The ID of the authenticated user
   * @returns The operation result
   */
  private async handleGroupRequest(
    operation: string,
    params: any,
    userId: string,
  ): Promise<any> {
    switch (operation) {
      case 'get':
        return this.groupHandler.getGroup(params, userId);
      case 'list':
        return this.groupHandler.listGroups(params, userId);
      case 'create':
        return this.groupHandler.createGroup(params, userId);
      case 'update':
        return this.groupHandler.updateGroup(params, userId);
      case 'delete':
        return this.groupHandler.deleteGroup(params, userId);
      case 'addMember':
        return this.groupHandler.addGroupMember(params, userId);
      case 'removeMember':
        return this.groupHandler.removeGroupMember(params, userId);
      default:
        throw createMethodNotFoundError(`group.${operation}`);
    }
  }

  /**
   * Handle workspace-related requests
   *
   * @param operation The operation to perform
   * @param params The operation parameters
   * @param userId The ID of the authenticated user
   * @returns The operation result
   */
  private async handleWorkspaceRequest(
    operation: string,
    params: any,
    userId: string,
  ): Promise<any> {
    switch (operation) {
      case 'get':
        return this.workspaceHandler.getWorkspace(params, userId);
      case 'list':
        return this.workspaceHandler.listWorkspaces(params, userId);
      case 'update':
        return this.workspaceHandler.updateWorkspace(params, userId);
      case 'create':
        return this.workspaceHandler.createWorkspace(params, userId);
      case 'delete':
        return this.workspaceHandler.deleteWorkspace(params, userId);
      case 'addMember':
        return this.workspaceHandler.addMember(params, userId);
      case 'removeMember':
        return this.workspaceHandler.removeMember(params, userId);
      default:
        throw createMethodNotFoundError(`workspace.${operation}`);
    }
  }

  /**
   * Handle attachment-related requests
   *
   * @param operation The operation to perform
   * @param params The operation parameters
   * @param userId The ID of the user making the request
   * @returns The operation result
   */
  private async handleAttachmentRequest(
    operation: string,
    params: any,
    userId: string,
  ): Promise<any> {
    switch (operation) {
      case 'list':
        return this.attachmentHandler.listAttachments(params, userId);
      case 'get':
        return this.attachmentHandler.getAttachment(params, userId);
      case 'upload':
        return this.attachmentHandler.uploadAttachment(params, userId);
      case 'download':
        return this.attachmentHandler.downloadAttachment(params, userId);
      case 'delete':
        return this.attachmentHandler.deleteAttachment(params, userId);
      default:
        throw createMethodNotFoundError(`attachment.${operation}`);
    }
  }

  /**
   * Handle comment-related requests
   *
   * @param operation The operation to perform
   * @param params The operation parameters
   * @param userId The ID of the authenticated user
   * @returns The operation result
   */
  private async handleCommentRequest(
    operation: string,
    params: any,
    userId: string,
  ): Promise<any> {
    switch (operation) {
      case 'create':
        return this.commentHandler.createComment(params, userId);
      case 'get':
        return this.commentHandler.getComment(params, userId);
      case 'list':
        return this.commentHandler.listComments(params, userId);
      case 'update':
        return this.commentHandler.updateComment(params, userId);
      case 'delete':
        return this.commentHandler.deleteComment(params, userId);
      default:
        throw createMethodNotFoundError(`comment.${operation}`);
    }
  }

  /**
   * Handle system-related requests
   *
   * @param operation The operation to perform
   * @param params The operation parameters
   * @returns The operation result
   */
  private async handleSystemRequest(
    operation: string,
    params: any,
  ): Promise<any> {
    switch (operation) {
      case 'listMethods':
        return this.systemHandler.listMethods();
      case 'getMethodSchema':
        return this.systemHandler.getMethodSchema(params);
      default:
        throw createMethodNotFoundError(`system.${operation}`);
    }
  }

  /**
   * Handle context-related requests
   *
   * @param operation The operation to perform
   * @param params The operation parameters
   * @param userId The ID of the authenticated user
   * @returns The operation result
   */
  private async handleContextRequest(
    operation: string,
    params: any,
    userId: string,
  ): Promise<any> {
    switch (operation) {
      case 'set':
        return this.contextHandler.setContext(params, userId);
      case 'get':
        return this.contextHandler.getContext(params, userId);
      case 'delete':
        return this.contextHandler.deleteContext(params, userId);
      case 'list':
        return this.contextHandler.listContextKeys(params, userId);
      case 'clear':
        return this.contextHandler.clearSessionContext(params, userId);
      default:
        throw createMethodNotFoundError(`context.${operation}`);
    }
  }

  /**
   * Validate an MCP request
   *
   * @param request The MCP request to validate
   */
  private validateRequest(request: MCPRequest): void {
    if (!request) {
      throw createParseError('Invalid request');
    }

    if (request.jsonrpc !== '2.0') {
      throw createInvalidRequestError('Unsupported JSON-RPC version');
    }

    if (!request.method || typeof request.method !== 'string') {
      throw createInvalidRequestError('Method must be a string');
    }

    if (!request.method.includes('.')) {
      throw createInvalidRequestError(
        'Method must be in format "resource.operation"',
      );
    }

    if (request.id === undefined || request.id === null) {
      throw createInvalidRequestError('Id is required');
    }
  }

  /**
   * Handle an error that occurred during request processing
   *
   * @param error The error that occurred
   * @param id The request id
   * @returns An MCP error response
   */
  private handleError(error: any, id: string | number | null): MCPResponse {
    this.logger.error('Error processing MCP request', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      'message' in error
    ) {
      return {
        jsonrpc: '2.0',
        error: error,
        id: id || null,
      };
    }

    return {
      jsonrpc: '2.0',
      error: createInternalError(error?.message || String(error)),
      id: id || null,
    };
  }
}
