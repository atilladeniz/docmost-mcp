# Docmost MCP Implementation Plan

## Overview

This document outlines the plan to add Machine Control Protocol (MCP) functionality to Docmost, enabling external systems and automation tools to programmatically control all Docmost features.

## Table of Contents

- [Goals](#goals)
- [MCP Architecture](#mcp-architecture)
- [Core Functionality](#core-functionality)
- [Implementation Plan](#implementation-plan)
- [Security Considerations](#security-considerations)
- [Technical Implementation Details](#technical-implementation-details)
- [Testing Strategy](#testing-strategy)
- [Deployment Considerations](#deployment-considerations)
- [Timeline](#timeline)
- [Progress Tracking](#progress-tracking)

## Goals

- [x] Create an MCP server that provides programmatic access to all Docmost functionality
- [x] Enable external systems to create, read, update, and delete Docmost resources
- [ ] Support real-time interactions with the Docmost platform
- [x] Provide proper authentication and authorization for MCP clients
- [x] Maintain security and performance of the main application

## MCP Architecture

### MCP Server Component

- [x] Implement a new module called `MCPModule` in the server application
  - File: `apps/server/src/integrations/mcp/mcp.module.ts`
  - Responsibilities:
    - [x] Define MCP-specific controllers and services
    - [x] Register MCP-specific event handlers
    - [x] Configure MCP-specific middleware and guards

### MCP Controller

- [x] Create an MCP controller that will handle incoming MCP requests
  - File: `apps/server/src/integrations/mcp/mcp.controller.ts`
  - Capabilities:
    - [x] Authenticate MCP clients
    - [x] Process commands received from MCP clients
    - [x] Return appropriate responses based on command execution
    - [ ] Stream real-time updates when needed

### MCP Protocol Design

- [x] Design the MCP protocol based on JSON-RPC 2.0 format

```typescript
// Request format
interface MCPRequest {
  jsonrpc: "2.0";
  method: string;   // e.g., "page.create", "page.update", etc.
  params: any;      // Parameters specific to the method
  id: string | number; // Request identifier for correlation
}

// Response format
interface MCPResponse {
  jsonrpc: "2.0";
  result?: any;     // Result of the command execution
  error?: {         // Error information if the command failed
    code: number;
    message: string;
    data?: any;
  };
  id: string | number; // Same as request identifier
}
```

## Core Functionality

### Workspace Operations

- [x] Create workspace (`workspace.create`)
- [x] Get workspace details (`workspace.get`)
- [x] Update workspace settings (`workspace.update`)
- [x] List workspaces (`workspace.list`)
- [x] Add members to workspace (`workspace.addMember`)
- [x] Remove members from workspace (`workspace.removeMember`)
- [x] Delete workspace (`workspace.delete`)

### Space Operations

- [x] Create spaces (`space.create`)
- [x] Get space details (`space.get`)
- [x] List spaces (`space.list`)
- [x] Update space settings (`space.update`)
- [x] Manage space permissions (`space.updatePermissions`)
- [x] Delete spaces (`space.delete`)

### Page Operations

- [x] Get page by ID (`page.get`)
- [x] List pages (`page.list`)
- [x] Create pages (`page.create`)
- [x] Update page content (`page.update`)
- [x] Move pages between spaces (`page.move`)
- [x] Delete pages (`page.delete`)
- [ ] Get page history (`page.getHistory`)
- [ ] Restore page version (`page.restore`)
- [x] Search pages (`page.search`)

### User and Group Operations

- [x] Get user information (`user.get`)
- [x] List users (`user.list`)
- [x] Update user profile (`user.update`)
- [x] Create groups (`group.create`)
- [x] Get group details (`group.get`)
- [x] List groups (`group.list`)
- [x] Update groups (`group.update`)
- [x] Add members to group (`group.addMember`)
- [x] Remove members from group (`group.removeMember`)
- [x] Delete groups (`group.delete`)

### Attachment Operations

- [x] Upload attachments (`attachment.upload`)
- [x] Get attachment details (`attachment.get`)
- [x] List attachments (`attachment.list`)
- [x] Download attachments (`attachment.download`)
- [x] Delete attachments (`attachment.delete`)

### Comment Operations

- [x] Create comments (`comment.create`)
- [x] Get comment details (`comment.get`)
- [x] List comments (`comment.list`)
- [x] Update comments (`comment.update`)
- [x] Delete comments (`comment.delete`)

## Implementation Plan

### Phase 1: MCP Server Setup (2-3 weeks)

- [x] Create the basic MCP module structure
- [x] Set up JSON-RPC 2.0 protocol implementation
- [x] Implement authentication for MCP clients
- [x] Define the core protocol handler
- [x] Create standardized error handling
- [x] Implement operation-level permissions

### Phase 2: Core Resource Handlers (4-6 weeks)

- [x] Implement page operations
  - [x] Read page by ID (`page.get`)
  - [x] List pages (`page.list`)
  - [x] Create pages (`page.create`)
  - [x] Update pages (`page.update`)
  - [x] Delete pages (`page.delete`)
  - [x] Move pages (`page.move`)
  - [x] Search pages (`page.search`)
  
- [x] Implement workspace operations
  - [x] Create workspace (`workspace.create`)
  - [x] Get workspace details (`workspace.get`)
  - [x] Update workspace settings (`workspace.update`)
  - [x] List workspaces (`workspace.list`)
  - [x] Manage workspace members (`workspace.addMember`, `workspace.removeMember`)
  - [x] Delete workspace (`workspace.delete`)

- [x] Implement space operations
  - [x] Create spaces (`space.create`)
  - [x] Get space details (`space.get`)
  - [x] List spaces (`space.list`)
  - [x] Update space settings (`space.update`)
  - [x] Manage space permissions (`space.updatePermissions`)
  - [x] Delete spaces (`space.delete`)

- [x] Implement user and group operations
  - [x] User operations (`user.get`, `user.list`)
  - [x] User update operation (`user.update`)
  - [x] Group operations (`group.create`, `group.update`, `group.delete`)
  - [x] Group membership (`group.addMember`, `group.removeMember`)

### Phase 3: Advanced Features (3-4 weeks)

- [x] Add support for batched operations
- [ ] Implement real-time updates via WebSockets
  - [ ] Real-time page content updates
  - [ ] Comment notifications
  - [ ] User presence indicators
- [ ] Add rate limiting and throttling
  - [ ] Configure rate limits per operation
  - [ ] Implement graduated throttling for heavy users
  - [ ] Add rate limit headers to responses
- [ ] Implement comprehensive logging and monitoring
  - [x] Basic logging
  - [ ] Add detailed request/response logging
  - [ ] Implement metrics collection
  - [ ] Create monitoring dashboards

### Phase 4: SDK and Documentation (2-3 weeks)

- [ ] Create client SDKs
  - [ ] JavaScript/TypeScript SDK
  - [ ] Python SDK
  - [ ] Go SDK (optional)
- [ ] Write comprehensive API documentation
  - [ ] Protocol specification
  - [ ] Method reference
  - [ ] Authentication guide
  - [ ] Error handling guide
- [ ] Create examples and tutorials
  - [ ] Basic operations examples
  - [ ] Authentication examples
  - [ ] Advanced usage patterns
  - [ ] Integration examples

## Security Considerations

### Authentication

- [x] Implement token-based authentication for MCP clients
- [ ] Support API keys with appropriate scopes
- [ ] Enable OAuth2 integration for enterprise scenarios

### Authorization

- [x] Enforce the same permission checks as the main application
- [x] Add MCP-specific permission scopes
- [ ] Implement audit logging for MCP operations

### Rate Limiting

- [ ] Apply rate limits to prevent abuse
- [ ] Implement graduated throttling
- [ ] Add monitoring for suspicious activity

## Technical Implementation Details

### Code Structure

```
apps/server/src/integrations/mcp/
├── mcp.module.ts            # Main module definition
├── mcp.controller.ts        # Handles incoming MCP requests
├── mcp.service.ts           # Core MCP service
├── dto/                     # Data transfer objects for MCP
├── interfaces/              # MCP-specific interfaces
├── handlers/                # Command handlers for different resources
│   ├── page.handler.ts       
│   ├── workspace.handler.ts  
│   ├── space.handler.ts      
│   └── ...
├── guards/                  # Authentication and authorization guards
└── utils/                   # Utility functions
```

### Integration Points

- [x] Add MCP-specific controllers and routes to the existing NestJS application
- [x] Reuse existing service implementations but add MCP-specific wrappers
- [ ] Register MCP-specific event listeners for real-time updates
- [x] Add MCP-specific authentication provider

## Testing Strategy

- [ ] Unit tests for individual MCP handlers
- [ ] Integration tests for MCP command processing
- [ ] End-to-end tests simulating real MCP client interactions
- [ ] Performance testing to ensure MCP doesn't impact main application
- [ ] Security testing to verify proper access controls

## Deployment Considerations

- [x] Integrate MCP server with the main Docmost application
- [ ] Consider separate scaling for MCP traffic if needed
- [ ] Add MCP-specific monitoring and alerting
- [ ] Update deployment scripts to include MCP configuration

## Timeline

- Phase 1 (MCP Server Setup): 2-3 weeks
- Phase 2 (Core Resource Handlers): 4-6 weeks
- Phase 3 (Advanced Features): 3-4 weeks
- Phase 4 (SDK and Documentation): 2-3 weeks

Total estimated time: 11-16 weeks

## Progress Tracking

| Task | Status | Assigned To | Start Date | Completion Date | Notes |
|------|--------|-------------|------------|-----------------|-------|
| **Phase 1: MCP Server Setup** | In Progress | | 2024-04-14 | | |
| ↳ Create basic MCP module structure | Completed | | 2024-04-14 | 2024-04-14 | Created MCP module, controller, service, and interfaces |
| ↳ Set up JSON-RPC 2.0 protocol implementation | Completed | | 2024-04-14 | 2024-04-14 | Implemented protocol with appropriate interfaces |
| ↳ Implement authentication for MCP clients | Completed | | 2024-04-14 | 2024-04-14 | Using existing JwtAuthGuard and passing user to handlers |
| ↳ Define the core protocol handler | Completed | | 2024-04-14 | 2024-04-14 | JSON-RPC 2.0 protocol implementation completed with error handling |
| ↳ Create standardized error handling | Completed | | 2024-04-14 | 2024-04-14 | Created error utilities for consistent JSON-RPC error responses |
| ↳ Implement operation-level permissions | Completed | | 2024-04-14 | 2024-04-14 | Created MCPPermissionGuard with permission level mapping |
| **Phase 2: Core Resource Handlers** | In Progress | | 2024-04-14 | | |
| **↳ Page Operations** | In Progress | | 2024-04-14 | | |
| ⠀⠀↳ Read page by ID (page.get) | Completed | | 2024-04-14 | 2024-04-14 | Implemented with permission checking |
| ⠀⠀↳ List pages (page.list) | Completed | | 2024-04-15 | 2024-04-15 | Implemented with pagination and permission checking |
| ⠀⠀↳ Create pages (page.create) | Completed | | 2024-04-15 | 2024-04-15 | Implemented with permission checking |
| ⠀⠀↳ Update pages (page.update) | Completed | | 2024-04-15 | 2024-04-15 | Implemented with permission checking |
| ⠀⠀↳ Delete pages (page.delete) | Completed | | 2024-04-15 | 2024-04-15 | Implemented with permission checking |
| ⠀⠀↳ Move pages (page.move) | Completed | | 2024-04-15 | 2024-04-15 | Implemented with permission checking |
| ⠀⠀↳ Search pages (page.search) | Completed | | 2024-04-15 | 2024-04-15 | Implemented with pagination and permission checking |
| **↳ Workspace Operations** | In Progress | | 2024-04-18 | | |
| ⠀⠀↳ Create workspace (workspace.create) | Completed | | 2024-04-19 | 2024-04-19 | Implemented with admin permission checking |
| ⠀⠀↳ Get workspace details (workspace.get) | Completed | | 2024-04-18 | 2024-04-18 | Implemented with workspace validation |
| ⠀⠀↳ Update workspace settings (workspace.update) | Completed | | 2024-04-18 | 2024-04-18 | Implemented with permission checking |
| ⠀⠀↳ List workspaces (workspace.list) | Completed | | 2024-04-18 | 2024-04-18 | Implemented with basic pagination |
| ⠀⠀↳ Manage workspace members | Completed | | 2024-05-22 | 2024-05-22 | Implemented workspace.addMember and workspace.removeMember operations |
| ⠀⠀↳ Delete workspace (workspace.delete) | Completed | | 2024-04-19 | 2024-04-19 | Implemented with admin permission checking and cascade delete |
| **↳ Space Operations** | In Progress | | 2024-04-15 | | |
| ⠀⠀↳ Create spaces (space.create) | Completed | | 2024-04-15 | 2024-04-15 | Implemented with proper user authentication |
| ⠀⠀↳ Get space details (space.get) | Completed | | 2024-04-15 | 2024-04-15 | Implemented with workspace validation |
| ⠀⠀↳ List spaces (space.list) | Completed | | 2024-04-15 | 2024-04-15 | Implemented with pagination support |
| ⠀⠀↳ Update space settings (space.update) | Completed | | 2024-04-15 | 2024-04-15 | Implemented with permission checking |
| ⠀⠀↳ Manage space permissions (space.updatePermissions) | Completed | | 2024-04-15 | 2024-04-15 | Implemented role updates for users/groups |
| ⠀⠀↳ Delete spaces (space.delete) | Completed | | 2024-04-15 | 2024-04-15 | Implemented with permission checking |
| **↳ User and Group Operations** | In Progress | | 2024-04-20 | | |
| ⠀⠀↳ User operations | In Progress | | 2024-04-20 | | |
| ⠀⠀⠀⠀↳ Get user information (user.get) | Completed | | 2024-04-20 | 2024-04-20 | Implemented with permission checks |
| ⠀⠀⠀⠀↳ List users (user.list) | Completed | | 2024-04-20 | 2024-04-20 | Implemented with pagination |
| ⠀⠀⠀⠀↳ Update user profile (user.update) | Completed | | 2024-05-22 | 2024-05-22 | Implemented with permission checks |
| ⠀⠀↳ Group operations | In Progress | | 2024-04-20 | | |
| ⠀⠀⠀⠀↳ Get group details (group.get) | Completed | | 2024-04-20 | 2024-04-20 | Implemented with permission checks |
| ⠀⠀⠀⠀↳ List groups (group.list) | Completed | | 2024-04-20 | 2024-04-20 | Implemented with pagination |
| ⠀⠀⠀⠀↳ Create groups (group.create) | Completed | | 2024-05-22 | 2024-05-22 | Implemented with permission checks |
| ⠀⠀⠀⠀↳ Update groups (group.update) | Completed | | 2024-05-22 | 2024-05-22 | Implemented with permission checks |
| ⠀⠀⠀⠀↳ Delete groups (group.delete) | Completed | | 2024-05-22 | 2024-05-22 | Implemented with permission checks |
| ⠀⠀↳ Group membership | Completed | | 2024-05-22 | 2024-05-22 | |
| ⠀⠀⠀⠀↳ Add members to group (group.addMember) | Completed | | 2024-05-22 | 2024-05-22 | Implemented with permission checks |
| ⠀⠀⠀⠀↳ Remove members from group (group.removeMember) | Completed | | 2024-05-22 | 2024-05-22 | Implemented with permission checks |
| **↳ Attachment Operations** | Completed | | 2024-05-30 | 2024-05-30 | |
| ⠀⠀↳ Upload attachments (attachment.upload) | Completed | | 2024-05-30 | 2024-05-30 | Implemented with permission checks |
| ⠀⠀↳ Get attachment details (attachment.get) | Completed | | 2024-05-30 | 2024-05-30 | Implemented with permission checks |
| ⠀⠀↳ List attachments (attachment.list) | Completed | | 2024-05-30 | 2024-05-30 | Implemented with pagination and permission checks |
| ⠀⠀↳ Download attachments (attachment.download) | Completed | | 2024-05-30 | 2024-05-30 | Implemented with permission checks |
| ⠀⠀↳ Delete attachments (attachment.delete) | Completed | | 2024-05-30 | 2024-05-30 | Implemented with permission checks |
| **Phase 3: Advanced Features** | In Progress | | 2024-04-14 | | |
| ↳ Add support for batched operations | Completed | | 2024-04-14 | 2024-04-14 | Implemented batch endpoint in controller |
| ↳ Implement real-time updates | Not Started | | | | |
| ↳ Implement rate limiting and throttling | Not Started | | | | |
| ↳ Add comprehensive logging and monitoring | In Progress | | 2024-04-14 | | Basic logging implemented |
| **Phase 4: SDK and Documentation** | Not Started | | | | |
| ↳ Create client SDKs | Not Started | | | | |
| ↳ Write comprehensive API documentation | Not Started | | | | |
| ↳ Create examples and tutorials | Not Started | | | | |

## Example MCP Usage

```javascript
// Example: Creating a new page via MCP
const mcpRequest = {
  jsonrpc: "2.0",
  method: "page.create",
  params: {
    spaceId: "space-123",
    title: "My New Page",
    content: "This is the content of my new page",
    parentPageId: "parent-page-456" // Optional
  },
  id: "request-1"
};

// Sending the request
const response = await fetch("https://example.docmost.com/api/mcp", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_MCP_TOKEN"
  },
  body: JSON.stringify(mcpRequest)
});

const result = await response.json();
// result.result will contain the created page information
```

---

**Note:** This document should be updated regularly to track progress and capture any design decisions or changes to the implementation plan. 