import { Module } from '@nestjs/common';
import { MCPController } from './mcp.controller';
import { MCPService } from './mcp.service';
import { PageHandler } from './handlers/page.handler';
import { PageModule } from '../../core/page/page.module';
import { CaslModule } from '../../core/casl/casl.module';
import { MCPPermissionGuard } from './guards/mcp-permission.guard';

/**
 * Machine Control Protocol (MCP) Module
 *
 * This module provides programmatic access to Docmost functionality
 * through a JSON-RPC 2.0 based protocol.
 */
@Module({
  imports: [
    // Import modules that contain services needed by handlers
    PageModule,
    CaslModule,
  ],
  controllers: [MCPController],
  providers: [
    MCPService,
    // Register all handlers
    PageHandler,
    // Register guards
    MCPPermissionGuard,
  ],
  exports: [MCPService],
})
export class MCPModule {}
