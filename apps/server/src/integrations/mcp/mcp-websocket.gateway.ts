import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { TokenService } from '../../core/auth/services/token.service';
import { JwtPayload, JwtType } from '../../core/auth/dto/jwt-payload';
import {
  MCPEvent,
  MCPEventType,
  MCPOperationType,
  MCPResourceType,
} from './interfaces/mcp-event.interface';
import * as cookie from 'cookie';
import { WorkspaceService } from '../../core/workspace/services/workspace.service';
import { MCPPermissionGuard } from './guards/mcp-permission.guard';

/**
 * MCP WebSocket Gateway
 *
 * Handles real-time communication for MCP events using WebSockets.
 * This enables clients to receive real-time updates for resources they have access to.
 */
@WebSocketGateway({
  namespace: 'mcp',
  transports: ['websocket'],
  cors: { origin: '*' },
})
export class MCPWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MCPWebSocketGateway.name);
  private connectedClients: Map<
    string,
    { userId: string; workspaceId: string }
  > = new Map();

  constructor(
    private tokenService: TokenService,
    private workspaceService: WorkspaceService,
  ) {}

  /**
   * Handle client connections
   *
   * Verifies the client's JWT token, sets up room subscriptions,
   * and stores client information.
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      this.logger.log(`Client connected: ${client.id}`);

      // Authenticate via cookies or auth header
      let token: JwtPayload;
      try {
        const cookies = cookie.parse(client.handshake.headers.cookie || '');
        token = await this.tokenService.verifyJwt(
          cookies['authToken'],
          JwtType.ACCESS,
        );
      } catch (e) {
        // Try auth header if cookie fails
        const authHeader = client.handshake.headers.authorization;
        if (!authHeader) {
          throw new Error('No authentication provided');
        }
        const jwt = authHeader.replace('Bearer ', '');
        token = await this.tokenService.verifyJwt(jwt, JwtType.ACCESS);
      }

      if (!token) {
        throw new Error('Invalid token');
      }

      const userId = token.sub;
      const workspaceId = token.workspaceId;

      // Store client info
      this.connectedClients.set(client.id, { userId, workspaceId });

      // Join workspace room
      const workspaceRoom = this.getWorkspaceRoomName(workspaceId);
      client.join(workspaceRoom);

      // Join user-specific room
      const userRoom = this.getUserRoomName(userId);
      client.join(userRoom);

      this.logger.debug(
        `Client ${client.id} authenticated as user ${userId} in workspace ${workspaceId}`,
      );

      // Emit successful connection event
      client.emit('mcp:connected', { userId, workspaceId });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Client connection error: ${err.message}`, err.stack);
      client.emit('mcp:error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  /**
   * Handle client disconnections
   *
   * Cleans up resources when clients disconnect.
   */
  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  /**
   * Subscribe to a resource
   *
   * Allows clients to subscribe to specific resources for real-time updates.
   */
  @SubscribeMessage('mcp:subscribe')
  handleSubscribe(
    client: Socket,
    @MessageBody()
    payload: {
      resourceType: MCPResourceType;
      resourceId: string;
    },
  ): void {
    try {
      const clientInfo = this.connectedClients.get(client.id);
      if (!clientInfo) {
        throw new Error('Client not authenticated');
      }

      const { resourceType, resourceId } = payload;
      const roomName = this.getResourceRoomName(resourceType, resourceId);

      this.logger.debug(`Client ${client.id} subscribing to ${roomName}`);
      client.join(roomName);

      client.emit('mcp:subscribed', { resourceType, resourceId });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Subscribe error: ${err.message}`);
      client.emit('mcp:error', {
        message: 'Failed to subscribe',
        error: err.message,
      });
    }
  }

  /**
   * Unsubscribe from a resource
   *
   * Allows clients to unsubscribe from specific resources.
   */
  @SubscribeMessage('mcp:unsubscribe')
  handleUnsubscribe(
    client: Socket,
    @MessageBody()
    payload: {
      resourceType: MCPResourceType;
      resourceId: string;
    },
  ): void {
    try {
      const { resourceType, resourceId } = payload;
      const roomName = this.getResourceRoomName(resourceType, resourceId);

      this.logger.debug(`Client ${client.id} unsubscribing from ${roomName}`);
      client.leave(roomName);

      client.emit('mcp:unsubscribed', { resourceType, resourceId });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Unsubscribe error: ${err.message}`);
      client.emit('mcp:error', {
        message: 'Failed to unsubscribe',
        error: err.message,
      });
    }
  }

  /**
   * Update presence status
   *
   * Allows clients to broadcast their presence information.
   */
  @SubscribeMessage('mcp:presence')
  handlePresence(
    client: Socket,
    @MessageBody()
    payload: {
      pageId: string;
      status: 'online' | 'offline' | 'idle';
      cursorPosition?: { x: number; y: number };
    },
  ): void {
    try {
      const clientInfo = this.connectedClients.get(client.id);
      if (!clientInfo) {
        throw new Error('Client not authenticated');
      }

      const { userId, workspaceId } = clientInfo;
      const { pageId, status, cursorPosition } = payload;

      // Create presence event
      const presenceEvent: MCPEvent = {
        type: MCPEventType.PRESENCE,
        resource: MCPResourceType.PAGE,
        operation: MCPOperationType.READ,
        resourceId: pageId,
        timestamp: new Date().toISOString(),
        userId,
        workspaceId,
        data: {
          status,
          cursorPosition,
          lastActive: new Date().toISOString(),
        },
      };

      // Broadcast to page room
      const roomName = this.getResourceRoomName(MCPResourceType.PAGE, pageId);
      this.server.to(roomName).emit('mcp:event', presenceEvent);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Presence update error: ${err.message}`);
      client.emit('mcp:error', {
        message: 'Failed to update presence',
        error: err.message,
      });
    }
  }

  /**
   * Publish an MCP event to relevant subscribers
   *
   * This method is called by other parts of the application to broadcast events.
   */
  public publishEvent(event: MCPEvent): void {
    try {
      this.logger.debug(
        `Publishing MCP event: ${event.type} ${event.resource} ${event.resourceId}`,
      );

      // Determine which rooms should receive this event
      const resourceRoom = this.getResourceRoomName(
        event.resource,
        event.resourceId,
      );
      const workspaceRoom = this.getWorkspaceRoomName(event.workspaceId);

      // Broadcast to relevant rooms
      this.server.to(resourceRoom).emit('mcp:event', event);
      this.server.to(workspaceRoom).emit('mcp:event', event);

      // If this is a user-specific event, also send to their room
      if (event.resource === MCPResourceType.USER) {
        const userRoom = this.getUserRoomName(event.resourceId);
        this.server.to(userRoom).emit('mcp:event', event);
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error publishing MCP event: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Get the room name for a specific resource
   */
  private getResourceRoomName(
    resourceType: MCPResourceType,
    resourceId: string,
  ): string {
    return `${resourceType}:${resourceId}`;
  }

  /**
   * Get the room name for a workspace
   */
  private getWorkspaceRoomName(workspaceId: string): string {
    return `workspace:${workspaceId}`;
  }

  /**
   * Get the room name for a user
   */
  private getUserRoomName(userId: string): string {
    return `user:${userId}`;
  }
}
