import { Injectable, Logger } from '@nestjs/common';
import { MCPRequest, MCPResponse, MCPError } from './interfaces/mcp.interface';
import { PageHandler } from './handlers/page.handler';
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

  constructor(private readonly pageHandler: PageHandler) {}

  /**
   * Process an MCP request and generate a response
   *
   * @param request The incoming MCP request
   * @param user The authenticated user
   * @returns The MCP response
   */
  async processRequest(request: MCPRequest, user: User): Promise<MCPResponse> {
    try {
      this.validateRequest(request);

      this.logger.log(`Processing MCP request for method: ${request.method}`);

      // Route the request to the appropriate handler based on method prefix
      const [resource, operation] = request.method.split('.');
      let result: any;

      switch (resource) {
        case 'page':
          result = await this.handlePageRequest(
            operation,
            request.params,
            user.id,
          );
          break;
        default:
          throw createMethodNotFoundError(request.method);
      }

      return {
        jsonrpc: '2.0',
        result,
        id: request.id,
      };
    } catch (error) {
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
      default:
        throw createMethodNotFoundError(`page.${operation}`);
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
