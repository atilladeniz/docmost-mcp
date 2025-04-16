import { Module } from '@nestjs/common';
import { MCPController } from './mcp.controller';
import { MCPService } from './mcp.service';
import { PageHandler } from './handlers/page.handler';
import { SpaceHandler } from './handlers/space.handler';
import { UserHandler } from './handlers/user.handler';
import { GroupHandler } from './handlers/group.handler';
import { WorkspaceHandler } from './handlers/workspace.handler';
import { AttachmentHandler } from './handlers/attachment.handler';
import { CommentHandler } from './handlers/comment.handler';
import { PageModule } from '../../core/page/page.module';
import { SpaceModule } from '../../core/space/space.module';
import { UserModule } from '../../core/user/user.module';
import { GroupModule } from '../../core/group/group.module';
import { WorkspaceModule } from '../../core/workspace/workspace.module';
import { CaslModule } from '../../core/casl/casl.module';
import { MCPPermissionGuard } from './guards/mcp-permission.guard';
import { AttachmentModule } from '../../core/attachment/attachment.module';
import { CommentModule } from '../../core/comment/comment.module';
import { MCPWebSocketGateway } from './mcp-websocket.gateway';
import { MCPEventService } from './services/mcp-event.service';
import { TokenModule } from '../../core/auth/token.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

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
    SpaceModule,
    UserModule,
    GroupModule,
    WorkspaceModule,
    AttachmentModule,
    CommentModule,
    CaslModule,
    TokenModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [MCPController],
  providers: [
    MCPService,
    // Register all handlers
    PageHandler,
    SpaceHandler,
    UserHandler,
    GroupHandler,
    WorkspaceHandler,
    AttachmentHandler,
    CommentHandler,
    // Register WebSocket components
    MCPWebSocketGateway,
    MCPEventService,
    // Register guards
    MCPPermissionGuard,
  ],
  exports: [MCPService, MCPEventService],
})
export class MCPModule {}
