import { Test, TestingModule } from '@nestjs/testing';
import { MCPService } from './mcp.service';
import { MCPRequest, MCPResponse, MCPErrorCode } from './interfaces/mcp.interface';
import { User } from '@docmost/db/types/entity.types';
import { PageHandler } from './handlers/page.handler';
import { SpaceHandler } from './handlers/space.handler';
import { UserHandler } from './handlers/user.handler';
import { GroupHandler } from './handlers/group.handler';
import { WorkspaceHandler } from './handlers/workspace.handler';
import { AttachmentHandler } from './handlers/attachment.handler';
import { CommentHandler } from './handlers/comment.handler';
import { SystemHandler } from './handlers/system.handler';
import { ContextHandler } from './handlers/context.handler';
import { UIHandler } from './handlers/ui.handler';
import { MCPContextService } from './services/mcp-context.service';

describe('MCPService', () => {
  let service: MCPService;
  let contextService: MCPContextService;
  let handlers: Map<string, any>;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    workspaceId: 'workspace-123',
    name: 'Test User',
    role: 'member',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockPageHandler = {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockSystemHandler = {
    ping: jest.fn(),
    listMethods: jest.fn(),
    getMethodSchema: jest.fn(),
  };

  const mockContextService = {
    clearContext: jest.fn(),
    getContext: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MCPService,
        {
          provide: PageHandler,
          useValue: mockPageHandler,
        },
        {
          provide: SpaceHandler,
          useValue: {},
        },
        {
          provide: UserHandler,
          useValue: {},
        },
        {
          provide: GroupHandler,
          useValue: {},
        },
        {
          provide: WorkspaceHandler,
          useValue: {},
        },
        {
          provide: AttachmentHandler,
          useValue: {},
        },
        {
          provide: CommentHandler,
          useValue: {},
        },
        {
          provide: SystemHandler,
          useValue: mockSystemHandler,
        },
        {
          provide: ContextHandler,
          useValue: {},
        },
        {
          provide: UIHandler,
          useValue: {},
        },
        {
          provide: MCPContextService,
          useValue: mockContextService,
        },
      ],
    }).compile();

    service = module.get<MCPService>(MCPService);
    contextService = module.get<MCPContextService>(MCPContextService);
    
    // Access the private handlers map for testing
    handlers = (service as any).handlers;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processRequest', () => {
    it('should process a valid request successfully', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        method: 'page.list',
        params: { spaceId: 'space-123' },
        id: 'req-123',
      };

      const expectedResult = { pages: [{ id: 'page-1', title: 'Test Page' }] };
      mockPageHandler.list.mockResolvedValue(expectedResult);

      const response = await service.processRequest(request, mockUser);

      expect(response).toEqual({
        jsonrpc: '2.0',
        result: expectedResult,
        id: 'req-123',
      });
      expect(mockPageHandler.list).toHaveBeenCalledWith(request.params, mockUser);
    });

    it('should validate JSON-RPC version', async () => {
      const request: MCPRequest = {
        jsonrpc: '1.0' as any,
        method: 'page.list',
        params: {},
        id: 'req-123',
      };

      const response = await service.processRequest(request, mockUser);

      expect(response).toEqual({
        jsonrpc: '2.0',
        error: {
          code: MCPErrorCode.INVALID_REQUEST,
          message: 'Invalid JSON-RPC version',
        },
        id: 'req-123',
      });
    });

    it('should handle missing method', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        method: '',
        params: {},
        id: 'req-123',
      };

      const response = await service.processRequest(request, mockUser);

      expect(response).toEqual({
        jsonrpc: '2.0',
        error: {
          code: MCPErrorCode.INVALID_REQUEST,
          message: 'Method is required',
        },
        id: 'req-123',
      });
    });

    it('should handle invalid method format', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        method: 'invalidmethod',
        params: {},
        id: 'req-123',
      };

      const response = await service.processRequest(request, mockUser);

      expect(response).toEqual({
        jsonrpc: '2.0',
        error: {
          code: MCPErrorCode.METHOD_NOT_FOUND,
          message: 'Invalid method format. Expected: resource.operation',
        },
        id: 'req-123',
      });
    });

    it('should handle unknown resource', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        method: 'unknown.operation',
        params: {},
        id: 'req-123',
      };

      const response = await service.processRequest(request, mockUser);

      expect(response).toEqual({
        jsonrpc: '2.0',
        error: {
          code: MCPErrorCode.METHOD_NOT_FOUND,
          message: 'Unknown resource: unknown',
        },
        id: 'req-123',
      });
    });

    it('should handle unknown operation', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        method: 'page.unknown',
        params: {},
        id: 'req-123',
      };

      const response = await service.processRequest(request, mockUser);

      expect(response).toEqual({
        jsonrpc: '2.0',
        error: {
          code: MCPErrorCode.METHOD_NOT_FOUND,
          message: 'Unknown operation: unknown for resource: page',
        },
        id: 'req-123',
      });
    });

    it('should handle handler errors', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        method: 'page.create',
        params: { title: 'Test' },
        id: 'req-123',
      };

      const error = new Error('Permission denied');
      mockPageHandler.create.mockRejectedValue(error);

      const response = await service.processRequest(request, mockUser);

      expect(response).toEqual({
        jsonrpc: '2.0',
        error: {
          code: MCPErrorCode.INTERNAL_ERROR,
          message: 'Permission denied',
        },
        id: 'req-123',
      });
    });

    it('should handle requests without id (notifications)', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        method: 'system.ping',
        params: {},
      };

      mockSystemHandler.ping.mockResolvedValue({ pong: true });

      const response = await service.processRequest(request, mockUser);

      expect(response).toEqual({
        jsonrpc: '2.0',
        result: { pong: true },
      });
      expect(response).not.toHaveProperty('id');
    });

    it('should clear context before processing each request', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        method: 'system.ping',
        params: {},
        id: 'req-123',
      };

      mockSystemHandler.ping.mockResolvedValue({ pong: true });

      await service.processRequest(request, mockUser);

      expect(mockContextService.clearContext).toHaveBeenCalled();
    });

    it('should handle null params', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        method: 'page.list',
        params: null as any,
        id: 'req-123',
      };

      mockPageHandler.list.mockResolvedValue({ pages: [] });

      const response = await service.processRequest(request, mockUser);

      expect(mockPageHandler.list).toHaveBeenCalledWith({}, mockUser);
      expect(response).toHaveProperty('result');
    });

    it('should handle undefined params', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        method: 'page.list',
        id: 'req-123',
      } as MCPRequest;

      mockPageHandler.list.mockResolvedValue({ pages: [] });

      const response = await service.processRequest(request, mockUser);

      expect(mockPageHandler.list).toHaveBeenCalledWith({}, mockUser);
      expect(response).toHaveProperty('result');
    });

    it('should preserve error data if present', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        method: 'page.create',
        params: { title: 'Test' },
        id: 'req-123',
      };

      const customError = {
        code: -32001,
        message: 'Custom error',
        data: { field: 'title', reason: 'Too short' },
      };
      mockPageHandler.create.mockRejectedValue(customError);

      const response = await service.processRequest(request, mockUser);

      expect(response).toEqual({
        jsonrpc: '2.0',
        error: {
          code: MCPErrorCode.INTERNAL_ERROR,
          message: 'Custom error',
        },
        id: 'req-123',
      });
    });
  });

  describe('handler registration', () => {
    it('should register all handlers correctly', () => {
      expect(handlers.has('page')).toBe(true);
      expect(handlers.has('space')).toBe(true);
      expect(handlers.has('user')).toBe(true);
      expect(handlers.has('group')).toBe(true);
      expect(handlers.has('workspace')).toBe(true);
      expect(handlers.has('attachment')).toBe(true);
      expect(handlers.has('comment')).toBe(true);
      expect(handlers.has('system')).toBe(true);
      expect(handlers.has('context')).toBe(true);
      expect(handlers.has('ui')).toBe(true);
    });
  });

  describe('error handling edge cases', () => {
    it('should handle errors without message', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        method: 'page.create',
        params: {},
        id: 'req-123',
      };

      const error = new Error();
      error.message = '';
      mockPageHandler.create.mockRejectedValue(error);

      const response = await service.processRequest(request, mockUser);

      expect(response.error?.message).toBe('An error occurred');
    });

    it('should handle non-Error objects thrown', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        method: 'page.create',
        params: {},
        id: 'req-123',
      };

      mockPageHandler.create.mockRejectedValue('String error');

      const response = await service.processRequest(request, mockUser);

      expect(response.error?.message).toBe('String error');
    });

    it('should handle null/undefined thrown', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        method: 'page.create',
        params: {},
        id: 'req-123',
      };

      mockPageHandler.create.mockRejectedValue(null);

      const response = await service.processRequest(request, mockUser);

      expect(response.error?.message).toBe('An error occurred');
    });
  });
});