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

- [ ] Create an MCP server that provides programmatic access to all Docmost functionality
- [ ] Enable external systems to create, read, update, and delete Docmost resources
- [ ] Support real-time interactions with the Docmost platform
- [ ] Provide proper authentication and authorization for MCP clients
- [ ] Maintain security and performance of the main application

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

- [ ] Create workspace (`workspace.create`)
- [ ] Get workspace details (`workspace.get`)
- [ ] Update workspace settings (`workspace.update`)
- [ ] List workspaces (`workspace.list`)
- [ ] Add members to workspace (`workspace.addMember`)
- [ ] Remove members from workspace (`workspace.removeMember`)
- [ ] Delete workspace (`workspace.delete`)

### Space Operations

- [ ] Create spaces (`space.create`)
- [ ] Get space details (`space.get`)
- [ ] List spaces (`space.list`)
- [ ] Update space settings (`space.update`)
- [ ] Manage space permissions (`space.updatePermissions`)
- [ ] Delete spaces (`space.delete`)

### Page Operations

- [x] Get page by ID (`page.get`)
- [ ] List pages (`page.list`)
- [ ] Create pages (`page.create`)
- [ ] Update page content (`page.update`)
- [ ] Move pages between spaces (`page.move`)
- [ ] Delete pages (`page.delete`)
- [ ] Get page history (`page.getHistory`)
- [ ] Restore page version (`page.restore`)
- [ ] Search pages (`page.search`)

### User and Group Operations

- [ ] Get user information (`user.get`)
- [ ] List users (`user.list`)
- [ ] Update user profile (`user.update`)
- [ ] Create groups (`group.create`)
- [ ] Get group details (`group.get`)
- [ ] List groups (`group.list`)
- [ ] Update groups (`group.update`)
- [ ] Add members to group (`group.addMember`)
- [ ] Remove members from group (`group.removeMember`)
- [ ] Delete groups (`group.delete`)

### Attachment Operations

- [ ] Upload attachments (`attachment.upload`)
- [ ] Get attachment details (`attachment.get`)
- [ ] List attachments (`attachment.list`)
- [ ] Download attachments (`attachment.download`)
- [ ] Delete attachments (`attachment.delete`)

### Comment Operations

- [ ] Create comments (`comment.create`)
- [ ] Get comment details (`comment.get`)
- [ ] List comments (`comment.list`)
- [ ] Update comments (`comment.update`)
- [ ] Delete comments (`comment.delete`)

## Implementation Plan

### Phase 1: MCP Server Setup (2-3 weeks)

- [x] Create the basic MCP module structure
- [x] Set up JSON-RPC 2.0 protocol implementation
- [x] Implement authentication for MCP clients
- [x] Define the core protocol handler
- [x] Create standardized error handling
- [x] Implement operation-level permissions

### Phase 2: Core Resource Handlers (4-6 weeks)

- [ ] Implement page operations
  - [x] Read page by ID (`page.get`)
  - [ ] List pages (`page.list`)
  - [ ] Create pages (`page.create`)
  - [ ] Update pages (`page.update`)
  - [ ] Delete pages (`page.delete`)
  - [ ] Move pages (`page.move`)
  - [ ] Search pages (`page.search`)
  
- [ ] Implement workspace operations
  - [ ] Create workspace (`workspace.create`)
  - [ ] Get workspace details (`workspace.get`)
  - [ ] Update workspace settings (`workspace.update`)
  - [ ] List workspaces (`workspace.list`)
  - [ ] Manage workspace members (`workspace.addMember`, `workspace.removeMember`)
  - [ ] Delete workspace (`workspace.delete`)

- [ ] Implement space operations
  - [ ] Create spaces (`space.create`)
  - [ ] Get space details (`space.get`)
  - [ ] List spaces (`space.list`)
  - [ ] Update space settings (`space.update`)
  - [ ] Manage space permissions (`space.updatePermissions`)
  - [ ] Delete spaces (`space.delete`)

- [ ] Implement user and group operations
  - [ ] User operations (`user.get`, `user.list`, `user.update`)
  - [ ] Group operations (`group.create`, `group.get`, `group.list`, `group.update`, `group.delete`)
  - [ ] Group membership (`group.addMember`, `group.removeMember`)

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
| ⠀⠀↳ Create pages (page.create) | Not Started | | | | |
| ⠀⠀↳ Update pages (page.update) | Not Started | | | | |
| ⠀⠀↳ Delete pages (page.delete) | Not Started | | | | |
| ⠀⠀↳ Move pages (page.move) | Not Started | | | | |
| ⠀⠀↳ Search pages (page.search) | Not Started | | | | |
| **↳ Workspace Operations** | Not Started | | | | |
| ⠀⠀↳ Create workspace (workspace.create) | Not Started | | | | |
| ⠀⠀↳ Get workspace details (workspace.get) | Not Started | | | | |
| ⠀⠀↳ Update workspace settings (workspace.update) | Not Started | | | | |
| ⠀⠀↳ List workspaces (workspace.list) | Not Started | | | | |
| ⠀⠀↳ Manage workspace members | Not Started | | | | |
| ⠀⠀↳ Delete workspace (workspace.delete) | Not Started | | | | |
| **↳ Space Operations** | Not Started | | | | |
| ⠀⠀↳ Create spaces (space.create) | Not Started | | | | |
| ⠀⠀↳ Get space details (space.get) | Not Started | | | | |
| ⠀⠀↳ List spaces (space.list) | Not Started | | | | |
| ⠀⠀↳ Update space settings (space.update) | Not Started | | | | |
| ⠀⠀↳ Manage space permissions (space.updatePermissions) | Not Started | | | | |
| ⠀⠀↳ Delete spaces (space.delete) | Not Started | | | | |
| **↳ User and Group Operations** | Not Started | | | | |
| ⠀⠀↳ User operations | Not Started | | | | |
| ⠀⠀↳ Group operations | Not Started | | | | |
| ⠀⠀↳ Group membership | Not Started | | | | |
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