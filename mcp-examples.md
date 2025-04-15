# Docmost MCP Examples - Workspace Operations

This document provides examples of using the Machine Control Protocol (MCP) for workspace operations in Docmost.

## Table of Contents
- [Getting Workspace Information](#getting-workspace-information)
- [Listing Workspaces](#listing-workspaces)
- [Creating a Workspace](#creating-a-workspace)
- [Updating a Workspace](#updating-a-workspace)
- [Adding Members to a Workspace](#adding-members-to-a-workspace)
- [Removing Members from a Workspace](#removing-members-from-a-workspace)
- [Deleting a Workspace](#deleting-a-workspace)

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

## Creating a Workspace

To create a new workspace:

```javascript
// Example: Create a new workspace
const createWorkspaceRequest = {
  jsonrpc: "2.0",
  method: "workspace.create",
  params: {
    name: "New Workspace",
    description: "A workspace for our team",
    hostname: "team-workspace"
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
  body: JSON.stringify(createWorkspaceRequest)
});

const result = await response.json();
// result.result will contain the created workspace information
```

### Notes on Workspace Creation

When creating a workspace, you can include the following properties in the `params` object:

- `name` (required): The name for the new workspace
- `description` (optional): A description for the workspace
- `hostname` (optional): A custom hostname for the workspace (must be unique)

The operation will:
1. Create a new workspace with the provided details
2. Create a default group for the workspace
3. Create a default "General" space in the workspace
4. Add the creating user as an owner of the workspace
5. Add the user to the default group

Note that workspace creation requires administrator privileges, and the user making the request must be either an OWNER or ADMIN.

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
  id: "request-4"
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

## Adding Members to a Workspace

To add a new member to a workspace by sending an invitation:

```javascript
// Example: Add a new member to workspace
const addMemberRequest = {
  jsonrpc: "2.0",
  method: "workspace.addMember",
  params: {
    workspaceId: "workspace-123",
    email: "newuser@example.com",
    role: "MEMBER"  // Optional, defaults to "MEMBER" (Alternatives: "ADMIN", "OWNER")
  },
  id: "request-5"
};

// You can also invite multiple users at once
const addMultipleMembersRequest = {
  jsonrpc: "2.0",
  method: "workspace.addMember",
  params: {
    workspaceId: "workspace-123",
    email: ["user1@example.com", "user2@example.com"],
    role: "MEMBER",
    groupIds: ["group-123", "group-456"]  // Optional, automatically add users to these groups
  },
  id: "request-6"
};

// Sending the request
const response = await fetch("https://example.docmost.com/api/mcp", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_MCP_TOKEN"
  },
  body: JSON.stringify(addMemberRequest)
});

const result = await response.json();
// result.result will contain success information and details about the invitation
```

### Notes on Adding Members

When adding members to a workspace:

- The `workspaceId` parameter is required
- The `email` parameter is required and can be a single email string or an array of email addresses
- The `role` parameter is optional and defaults to "MEMBER" (other options: "ADMIN", "OWNER")
- The `groupIds` parameter is optional and allows you to automatically add the new users to specific groups

The operation will:
1. Send an invitation email to the specified email address(es)
2. Create a pending invitation record in the database
3. When the invitation is accepted, the user will be added to the workspace with the specified role
4. If groupIds were provided, the user will also be added to those groups

## Removing Members from a Workspace

To remove a member from a workspace:

```javascript
// Example: Remove a member from workspace
const removeMemberRequest = {
  jsonrpc: "2.0",
  method: "workspace.removeMember",
  params: {
    workspaceId: "workspace-123",
    userId: "user-456"
  },
  id: "request-7"
};

// Sending the request
const response = await fetch("https://example.docmost.com/api/mcp", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_MCP_TOKEN"
  },
  body: JSON.stringify(removeMemberRequest)
});

const result = await response.json();
// result.result will indicate success or failure
```

### Notes on Removing Members

When removing a member from a workspace:

- The `workspaceId` parameter is required
- The `userId` parameter is required and must correspond to an existing user in the workspace

The operation will:
1. Anonymize the user's data in the workspace
2. Remove the user from all groups in the workspace
3. Remove the user from all spaces in the workspace
4. Delete the user's authentication accounts
5. Mark the user as deleted

There are several restrictions:
- You cannot remove the last workspace owner
- You cannot remove yourself
- Administrators cannot remove owners
- Only users with permission to manage workspace members can remove others

## Deleting a Workspace

To delete a workspace:

```javascript
// Example: Delete a workspace
const deleteWorkspaceRequest = {
  jsonrpc: "2.0",
  method: "workspace.delete",
  params: {
    workspaceId: "workspace-123"
  },
  id: "request-5"
};

// Sending the request
const response = await fetch("https://example.docmost.com/api/mcp", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_MCP_TOKEN"
  },
  body: JSON.stringify(deleteWorkspaceRequest)
});

const result = await response.json();
// result.result.success will be true if deletion was successful
```

### Notes on Workspace Deletion

When deleting a workspace:

- The `workspaceId` parameter is required
- The operation requires administrator privileges; the user making the request must be either an OWNER or ADMIN
- This is a permanent operation and will delete all data associated with the workspace, including:
  - All users in the workspace
  - All spaces and their content
  - All pages and their history
  - All groups and permissions
  - All attachments and files
  - All workspace settings and configurations

⚠️ **Warning**: This operation cannot be undone. It permanently removes all workspace data. 