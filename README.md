<div align="center">
    <h1><b>Docmost</b></h1>
    <p>
        Open-source collaborative wiki and documentation software.
        <br />
        <a href="https://docmost.com"><strong>Website</strong></a> | 
        <a href="https://docmost.com/docs"><strong>Documentation</strong></a>
    </p>
</div>
<br />

## Getting started

To get started with Docmost, please refer to our [documentation](https://docmost.com/docs).

## Features

- Real-time collaboration
- Diagrams (Draw.io, Excalidraw and Mermaid)
- Spaces
- Permissions management
- Groups
- Comments
- Page history
- Search
- File attachments
- Embeds (Airtable, Loom, Miro and more)
- Translations (10+ languages)
- AI Integration via Model Context Protocol (MCP)

## API Integrations

### Master Control API

Docmost provides a powerful JSON-RPC 2.0 API that allows programmatic access to all core functionality. This API enables:

- Managing spaces, pages, and comments
- User and workspace administration
- Group management
- File uploads and attachments
- UI navigation and control

The API follows JSON-RPC 2.0 protocol and is accessible at `/api/mcp` endpoint. Authentication is handled via API keys or JWT tokens.

Example request:
```json
{
  "jsonrpc": "2.0",
  "method": "page.create",
  "params": {
    "title": "New Page",
    "content": { "type": "doc", "content": [] },
    "spaceId": "01964ade-05e2-7c87-b4e0-fc434e340abb",
    "workspaceId": "01964ade-05e2-7c87-b4e0-fc434e340abb"
  },
  "id": 1
}
```

API documentation is available at `/api/mcp/openapi.json` when running the server. This provides a complete OpenAPI specification of all available methods and parameters.

### Model Context Protocol (MCP) Integration

Docmost integrates with AI assistants through the [Model Context Protocol](https://modelcontextprotocol.ai/), allowing AI models to:

- Create, read, update, and delete content
- Get contextual information about workspaces, spaces, and pages
- Interact with comments
- Navigate the UI
- Perform user management tasks

This integration enables seamless AI-assisted workflows within your documentation and knowledge base.

#### Using with Cursor

The MCP bridge allows AI assistants like Claude in Cursor to interact directly with your Docmost instance:

1. Configure your Cursor settings to use the MCP bridge:
   ```json
   {
     "mcpServers": {
       "docmost": {
         "command": "npx",
         "args": [
           "tsx",
           "./packages/mcp-bridge/src/index.ts"
         ],
         "env": {
           "MCP_DEBUG": "true",
           "MCP_SERVER_URL": "http://localhost:3000",
           "MCP_API_KEY": "your_api_key_here",
           "NODE_ENV": "development"
         }
       }
     }
   }
   ```

2. Create an API key for your Docmost server:
   ```sh
   ./register-mcp-api-key.sh "Cursor MCP Bridge"
   ```

3. Use the generated API key in your Cursor configuration.

4. Start using tools directly from Cursor to interact with your Docmost content!

#### Available MCP Tools

The MCP bridge provides the following tool categories:

**Content Management**
- `space_create`, `space_list`, `space_update`, `space_delete`: Manage spaces
- `page_create`, `page_list`, `page_update`, `page_delete`, `page_move`: Manage pages
- `comment_create`, `comment_list`, `comment_update`, `comment_delete`: Manage comments
- `attachment_upload`, `attachment_list`, `attachment_get`, `attachment_download`, `attachment_delete`: Manage file attachments

**User Management**
- `user_list`, `user_get`, `user_update`: Manage users
- `group_create`, `group_list`, `group_update`, `group_delete`, `group_addMember`, `group_removeMember`: Manage groups
- `workspace_create`, `workspace_list`, `workspace_update`, `workspace_delete`, `workspace_addMember`, `workspace_removeMember`: Manage workspaces

**UI Control**
- `ui_navigate`: Navigate to specific destinations in the Docmost interface

Each tool accepts specific parameters and can be called directly from AI assistants that support the Model Context Protocol.

### Screenshots

<p align="center">
<img alt="home" src="https://docmost.com/screenshots/home.png" width="70%">
<img alt="editor" src="https://docmost.com/screenshots/editor.png" width="70%">
</p>

### License
Docmost core is licensed under the open-source AGPL 3.0 license.  
Enterprise features are available under an enterprise license (Enterprise Edition).  

All files in the following directories are licensed under the Docmost Enterprise license defined in `packages/ee/License`.
  - apps/server/src/ee
  - apps/client/src/ee
  - packages/ee

### Contributing

See the [development documentation](https://docmost.com/docs/self-hosting/development)
