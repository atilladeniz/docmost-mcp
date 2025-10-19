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
- AI Integration via Model Context Protocol (MCP) *(HaruHunab1320 extension)*

## API Integrations (HaruHunab1320 Extensions)

> **Note**: The following API integrations are extensions developed by HaruHunab1320 and are not part of the official Docmost project.

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

This extension implements a bridge between Docmost and AI assistants using the Model Context Protocol.

Docmost integrates with AI assistants through the [Model Context Protocol](https://modelcontextprotocol.ai/), allowing AI models to:

- Create, read, update, and delete content
- Get contextual information about workspaces, spaces, and pages
- Interact with comments
- Navigate the UI
- Perform user management tasks

This integration enables seamless AI-assisted workflows within your documentation and knowledge base.

#### How to Install This MCP Server

Before wiring any client, make sure your Docmost instance is reachable (for example `https://docmost.nevuro.com`) and generate an API key for the bridge.

```sh
make claude-setup
```

The helper walks you through collecting the `APP_SECRET`, user ID, workspace ID, remote base URL, and (optionally) a custom API prefix. It then provisions the API key and registers the bridge with Claude Code automatically.

If you prefer the original manual flow, export your target instance before running the script:

```sh
DOCMOST_URL="https://your-docmost.example" \
DOCMOST_API_PREFIX="/api" \
./register-mcp-api-key.sh "Docmost MCP Bridge"
```

The script returns an `MCP_API_KEY` you can reuse below. Optional environment variables include `MCP_USER_ID`, `MCP_WORKSPACE_ID`, `MCP_USER_EMAIL`, and `DOCMOST_API_PREFIX` if you want to scope calls or override the API path.

> **Important:** Provide the Docmost user UUID (for example `0199970d-646b-7164-97a9-6dbadc88b4d1`), not an email address, when prompted for the user ID. The workspace ID must also be the UUID format.

##### For Claude Code

If you skipped the interactive helper, add the bridge manually (replace `/absolute/path/to/docmost-mcp` with the cloned repository path, set `MCP_SERVER_URL` to your instance, and paste the API key):

```sh
claude mcp add-json "docmost" '{
  "command": "npx",
  "args": ["tsx", "/absolute/path/to/docmost-mcp/packages/mcp-bridge/src/index.ts"],
  "env": {
    "MCP_SERVER_URL": "https://your-docmost.example",
    "MCP_API_KEY": "paste_api_key_here",
    "MCP_DEBUG": "true"
  }
}'
```

See the official [Claude Code MCP documentation](https://modelcontextprotocol.io/clients/claude-code) for advanced options such as per-workspace overrides.

##### For Cursor

Cursor supports global and project-scoped MCP servers. The configuration JSON is the same in both cases:

```json
{
  "mcpServers": {
    "docmost": {
      "command": "npx",
      "args": [
        "tsx",
        "/absolute/path/to/docmost-mcp/packages/mcp-bridge/src/index.ts"
      ],
      "env": {
        "MCP_DEBUG": "true",
        "MCP_SERVER_URL": "https://your-docmost.example",
        "MCP_API_KEY": "paste_api_key_here"
      }
    }
  }
}
```

- **Global install**: Cursor Settings → Tools & Integrations → *New MCP Server* opens `~/.cursor/mcp.json`; insert the snippet above.
- **Project install**: Add the snippet to `.cursor/mcp.json` in your project root.

After saving, revisit Settings → MCP and click the refresh icon so Cursor re-reads the configuration.

##### For Claude Desktop

Add the same configuration block to your Claude Desktop settings file and restart the app:

1. Locate the config file
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`
2. Add or merge the following JSON:
   ```json
   {
     "mcpServers": {
       "docmost": {
         "command": "npx",
        "args": [
          "tsx",
          "/absolute/path/to/docmost-mcp/packages/mcp-bridge/src/index.ts"
        ],
        "env": {
          "MCP_SERVER_URL": "https://your-docmost.example",
          "MCP_API_KEY": "paste_api_key_here",
          "MCP_DEBUG": "true"
        }
      }
     }
   }
   ```
3. Restart Claude Desktop to load the server.

Once the server is registered, you can prompt your assistant to use Docmost tools explicitly (for example, “use `page_create` to draft a new onboarding doc”), or allow it to invoke tools automatically when additional context is required.

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
