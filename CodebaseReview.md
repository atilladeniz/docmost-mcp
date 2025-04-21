# Docmost-MCP Codebase Review

## Overview

This document provides a comprehensive review of the Docmost codebase with a focus on the Model Context Protocol (MCP) integration and Master Control API extensions developed by HaruHunab1320.

## System Architecture

```
docmost/
├── apps/
│   ├── client/              # React frontend application
│   └── server/              # NestJS backend application
├── packages/
│   ├── mcp-bridge/          # MCP bridge for AI assistants
│   ├── editor-ext/          # Editor extensions
│   └── ee/                  # Enterprise edition features
└── various config files
```

## Core Components

### 1. Server Application (`apps/server/`)

The NestJS backend providing the core API, database access, and business logic.

#### Key Components:
- REST API endpoints
- Authentication and authorization
- Database access and models
- File storage
- WebSocket server for real-time collaboration

### 2. Client Application (`apps/client/`)

The React frontend providing the user interface.

#### Key Components:
- React components and pages
- State management
- API clients
- Real-time collaboration UI
- Editor components

### 3. Enterprise Edition (`packages/ee/`)

Features available under the enterprise license.

## Extension Components (HaruHunab1320)

### 1. Master Control API

**Location**: `apps/server/src/integrations/mcp/`

The Master Control API implements a JSON-RPC 2.0 interface that provides programmatic access to all Docmost functionality. It's designed to be a universal interface that can be used by any client, including AI assistants through the MCP bridge.

#### Key Components:

- **MCP Controller** (`mcp.controller.ts`): Handles HTTP requests for the MCP API
- **MCP Service** (`mcp.service.ts`): Core service that dispatches requests to appropriate handlers
- **Resource Handlers**: Individual handlers for different resources:
  - `page.handler.ts`: Page operations
  - `space.handler.ts`: Space operations
  - `comment.handler.ts`: Comment operations
  - `attachment.handler.ts`: File attachment operations
  - `user.handler.ts`: User operations
  - `group.handler.ts`: Group operations
  - `workspace.handler.ts`: Workspace operations
  - `ui.handler.ts`: UI navigation operations
  - `context.handler.ts`: Context gathering operations
  - `system.handler.ts`: System operations

- **Authentication & Authorization**:
  - `guards/mcp-auth.guard.ts`: Authentication guard supporting both JWT and API keys
  - `guards/mcp-api-key.guard.ts`: API key authentication guard
  - `guards/mcp-permission.guard.ts`: Permission validation guard

- **API Key Management**:
  - `services/mcp-api-key.service.ts`: Service for managing API keys
  - API key controller and repository

### 2. Model Context Protocol (MCP) Bridge

**Location**: `packages/mcp-bridge/`

The MCP Bridge implements the Model Context Protocol to allow AI assistants like Claude in Cursor to interact with Docmost.

#### Key Components:

- **Main Server** (`index.ts`): 
  - Initializes the MCP server
  - Registers tools based on resources
  - Handles parameter transformation and validation
  - Routes requests to the API

- **Resources** (`resources.ts`):
  - Defines schemas for all resources
  - Implements handlers for operations on each resource
  - Maps MCP tool parameters to API parameters

- **API Client** (`api.ts`):
  - Handles communication with the Docmost API
  - Formats requests as JSON-RPC
  - Handles authentication

### 3. WebSocket Events for MCP

**Location**: `apps/client/src/features/websocket/` and `apps/server/src/integrations/mcp/mcp-websocket.gateway.ts`

This extension enables real-time events for MCP operations, allowing the UI to react to changes made through the MCP API.

#### Key Components:

- **Server-side WebSocket Gateway**:
  - Broadcasts events for MCP operations
  - Handles socket authentication and connection management

- **Client-side Event Handling**:
  - `hooks/use-mcp-events.ts`: React hook for handling MCP events
  - `hooks/use-mcp-socket.ts`: Socket connection management

### 4. UI Navigation Handler

**Location**: `apps/server/src/integrations/mcp/handlers/ui.handler.ts`

Enables AI assistants to navigate the UI programmatically.

## Implementation Details

### Authentication Flow

1. **API Key Creation**:
   - Generated using the `register-mcp-api-key.sh` script
   - Stored securely with a hashed value in the database
   - Associated with a specific user and workspace

2. **API Key Authentication**:
   - Client includes API key in `Authorization: Bearer mcp_xxx` header
   - `MCPAuthGuard` attempts JWT authentication first, then falls back to API key
   - `MCPApiKeyGuard` validates the API key and loads the associated user
   - User context is attached to the request for permission checks

### MCP Bridge Request Flow

1. AI assistant calls an MCP tool (e.g., `space_list`)
2. MCP bridge receives the request and validates parameters
3. Bridge transforms parameters if needed (e.g., text to content object)
4. Bridge makes an API request to the Master Control API
5. API processes the request through the appropriate handler
6. Result is returned to the bridge
7. Bridge formats the response for the AI assistant

## Potential Issues and Considerations

### 1. Code Organization

- **MCP Bridge**: The `index.ts` file (580 lines) could be split into smaller modules for better maintainability
- **Resource Definitions**: The `resources.ts` file (779 lines) is quite large and could be split by resource type

### 2. Duplicate Code

- Parameter transformation logic exists in both the MCP bridge and server handlers
- Schema definitions exist in both locations

### 3. Error Handling

- Error handling in the MCP bridge could be more comprehensive
- Some error cases in the handlers could be better documented

### 4. Testing

- Need to assess test coverage for MCP-related functionality

### 5. Documentation

- API documentation could be more comprehensive
- Missing developer docs for extending MCP functionality

## Next Steps

1. **Code Refactoring**:
   - Split large files into modules
   - Standardize error handling
   - Remove duplicate code

2. **Documentation**:
   - Complete API reference
   - Developer guides for MCP integration

3. **Testing**:
   - Unit tests for MCP bridge
   - Integration tests for API

4. **Feature Enhancements**:
   - More sophisticated context gathering for AI assistants
   - Improved error messages and debugging support 