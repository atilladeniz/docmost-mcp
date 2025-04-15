import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { MCPService } from './mcp.service';
import { MCPRequest, MCPResponse } from './interfaces/mcp.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SkipTransform } from '../../common/decorators/skip-transform.decorator';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { User } from '@docmost/db/types/entity.types';
import { MCPPermissionGuard } from './guards/mcp-permission.guard';

/**
 * Machine Control Protocol (MCP) Controller
 *
 * This controller handles incoming HTTP requests for the MCP API.
 * It validates the requests and forwards them to the MCP service
 * for processing.
 */
@UseGuards(JwtAuthGuard, MCPPermissionGuard)
@Controller('mcp')
export class MCPController {
  private readonly logger = new Logger(MCPController.name);

  constructor(private readonly mcpService: MCPService) {}

  /**
   * Process an MCP request
   *
   * This endpoint accepts JSON-RPC 2.0 requests and returns
   * appropriate JSON-RPC 2.0 responses.
   *
   * @param request The MCP request
   * @param user The authenticated user
   * @returns The MCP response
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @SkipTransform()
  async processRequest(
    @Body() request: MCPRequest,
    @AuthUser() user: User,
  ): Promise<MCPResponse> {
    this.logger.debug(
      `Received MCP request from user ${user.id}: ${JSON.stringify(request)}`,
    );

    if (!request) {
      throw new BadRequestException('Invalid request');
    }

    return this.mcpService.processRequest(request, user);
  }

  /**
   * Process a batch of MCP requests
   *
   * This endpoint accepts an array of JSON-RPC 2.0 requests
   * and returns an array of JSON-RPC 2.0 responses.
   *
   * @param requests An array of MCP requests
   * @param user The authenticated user
   * @returns An array of MCP responses
   */
  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @SkipTransform()
  async processBatchRequest(
    @Body() requests: MCPRequest[],
    @AuthUser() user: User,
  ): Promise<MCPResponse[]> {
    this.logger.debug(
      `Received batch MCP request with ${requests?.length || 0} items from user ${user.id}`,
    );

    if (!Array.isArray(requests) || requests.length === 0) {
      throw new BadRequestException('Invalid batch request');
    }

    // Process each request in the batch
    const responses = await Promise.all(
      requests.map((request) => this.mcpService.processRequest(request, user)),
    );

    return responses;
  }
}
