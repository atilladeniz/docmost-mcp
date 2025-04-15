# Docmost MCP Examples - Workspace Operations

This document provides examples of using the Machine Control Protocol (MCP) for workspace operations in Docmost.

## Table of Contents
- [Getting Workspace Information](#getting-workspace-information)
- [Listing Workspaces](#listing-workspaces)
- [Updating a Workspace](#updating-a-workspace)

## Getting Workspace Information

To get information about a specific workspace:

```javascript
// Example: Get workspace information
const getWorkspaceRequest = {
  jsonrpc: "2.0",
  method: "workspace.get",
  params: {
    workspaceId: "workspace-123"
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
  body: JSON.stringify(getWorkspaceRequest)
});

const result = await response.json();
// result.result will contain the workspace information
```

## Listing Workspaces

To list all workspaces the authenticated user has access to:

```javascript
// Example: List workspaces
const listWorkspacesRequest = {
  jsonrpc: "2.0",
  method: "workspace.list",
  params: {},
  id: "request-2"
};

// Sending the request
const response = await fetch("https://example.docmost.com/api/mcp", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_MCP_TOKEN"
  },
  body: JSON.stringify(listWorkspacesRequest)
});

const result = await response.json();
// result.result.workspaces will contain the list of workspaces
// result.result.pagination will contain pagination information
```

## Updating a Workspace

To update a workspace's settings:

```javascript
// Example: Update workspace settings
const updateWorkspaceRequest = {
  jsonrpc: "2.0",
  method: "workspace.update",
  params: {
    workspaceId: "workspace-123",
    name: "New Workspace Name",
    description: "Updated workspace description",
    logo: "https://example.com/new-logo.png",
    emailDomains: ["example.com", "company.org"],
    enforceSso: true
  },
  id: "request-3"
};

// Sending the request
const response = await fetch("https://example.docmost.com/api/mcp", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_MCP_TOKEN"
  },
  body: JSON.stringify(updateWorkspaceRequest)
});

const result = await response.json();
// result.result will contain the updated workspace information
```

### Notes on Workspace Updates

When updating a workspace, you can include any of the following properties in the `params` object:

- `workspaceId` (required): The ID of the workspace to update
- `name`: The new name for the workspace
- `description`: The new description for the workspace
- `hostname`: A new hostname for the workspace (must be unique)
- `logo`: URL for the workspace logo
- `emailDomains`: Array of allowed email domains for auto-join
- `enforceSso`: Boolean indicating whether to enforce SSO authentication

When updating the `hostname`, please note:
- The hostname must be unique across all workspaces
- Certain hostnames are disallowed (common terms like "admin", "api", etc.)
- Changing the hostname will log users out of the old hostname

When enabling `enforceSso`, there must be at least one active SSO provider configured for the workspace. 