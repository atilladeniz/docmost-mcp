<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# Claude Code MCP Integration

This guide explains how to connect Anthropic's Claude Code client to a Docmost instance that runs remotely (for example `https://docmost.nevuro.com`). The same steps work for local setups—you only need to adjust the base URL used in the examples.

## Prerequisites
- A Docmost instance that is reachable from your workstation over HTTPS.
- Administrator access to that instance so you can retrieve the `APP_SECRET`, user ID, and workspace ID that the MCP bridge should act as.
- Node.js 20+ and pnpm installed locally (needed by the Docmost MCP bridge).
- The Claude Code CLI (`claude`) installed on your machine.
- This repository cloned locally so `packages/mcp-bridge/src/index.ts` is available to Claude Code.

## Quick setup (recommended)

Run the interactive helper from the repository root:

```bash
make claude-setup
```

The script prompts for the Docmost base URL, optional API prefix (default `/api`), `APP_SECRET`, user ID, and workspace ID, obtains an MCP API key from the remote instance, and registers the bridge with Claude Code under the chosen name (default `docmost`). You can re-run the command at any time to rotate the API key or change the configuration.

Continue with the manual instructions below if you prefer to perform the steps yourself or need to customize the process further.

## 1. Create an MCP API key on the remote instance
Claude authenticates against Docmost with an MCP-specific API key. Generate the key on the instance you want Claude to control.

### 1.1 Collect the required identifiers
You'll need three values before you can call the registration endpoint:
- **APP_SECRET** – The registration token configured on the Docmost server. If you host Docmost yourself, read it from the `.env` on the server or from the container's environment variables.
- **USER_ID** – The Docmost user the key should impersonate. You can copy the ID from the database (`users` table), from the admin UI (user detail view shows the UUID), or via API (`GET /api/users/:id`).
- _Tip_: The script needs the user UUID (for example `0199970d-646b-7164-97a9-6dbadc88b4d1`). Do not enter an email address.
- **WORKSPACE_ID** – The workspace the key should be scoped to. Retrieve it from the database (`workspaces` table), the workspace settings URL, or via API (`GET /api/workspaces`).

Keep these values secret—they grant the same permissions the corresponding user has.

### 1.2 Register the key via the public endpoint
Run the following from any machine that can reach your Docmost instance. Replace the placeholders with the values gathered above.

```bash
DOCMOST_URL="https://docmost.nevuro.com"
APP_SECRET="paste_app_secret_here"
USER_ID="paste_user_id_here"
WORKSPACE_ID="paste_workspace_id_here"
KEY_NAME="Claude MCP Bridge"

curl -sS -X POST "$DOCMOST_URL/api/api-keys/register" \
  -H "Content-Type: application/json" \
  -H "x-registration-token: $APP_SECRET" \
  -d "{\"userId\":\"$USER_ID\",\"workspaceId\":\"$WORKSPACE_ID\",\"name\":\"$KEY_NAME\"}"
```

The response contains a field named `key` (for example `mcp_xxx`). Copy it immediately—Docmost never shows the plain value again. Store it securely (a password manager or secrets vault).

If you prefer using the helper script in this repository, export `DOCMOST_URL` before running it:

```bash
DOCMOST_URL="https://docmost.nevuro.com" \
DOCMOST_API_PREFIX="/api" \
./register-mcp-api-key.sh "Claude MCP Bridge"
```

The script reads the same environment variables, prompts for any missing values, and hits the endpoint shown above.

## 2. Register the Docmost MCP bridge with Claude Code
Once you have an API key, wire the local bridge into Claude Code so the client can call Docmost tools.

```bash
claude mcp add-json "docmost" '{
  "command": "npx",
  "args": ["tsx", "/absolute/path/to/docmost-mcp/packages/mcp-bridge/src/index.ts"],
  "env": {
    "MCP_SERVER_URL": "https://docmost.nevuro.com",
    "MCP_API_KEY": "mcp_your_api_key_here",
    "MCP_DEBUG": "true"
  }
}'
```

- Replace `/absolute/path/to/docmost-mcp` with the location of this repository on your machine.
- Swap in the API key you generated in step 1.
- `MCP_DEBUG` is optional but useful while validating the connection.

Claude Code stores the configuration and automatically reconnects to the bridge after restarts. You can confirm that the server registered correctly via `claude mcp list`.

## 3. Test the integration
1. Open Claude Code and start a chat.
2. Ask Claude to call a simple tool, e.g. “List Docmost spaces”.
3. Watch the Claude Code sidebar for MCP requests. With `MCP_DEBUG` enabled you can also inspect the bridge logs in your terminal.

If the call succeeds, Claude is now operating against the remote instance.

## Troubleshooting & Security Notes
- Ensure the Docmost domain is reachable from your workstation and that any reverse proxy forwards WebSocket traffic if you intend to use real-time features.
- An MCP API key carries the full permissions of the associated user. Store it securely and revoke it from `https://docmost.nevuro.com/api/api-keys` if compromised.
- If the bridge reports 401/403 errors, double-check that the `userId` and `workspaceId` used during registration still exist and that the user has access to the workspace.
- Rotate the API key periodically and update the Claude configuration with the new value.

Once this setup is complete, Claude Code can automate tasks in your remote Docmost workspace using the provided MCP tools.

<!-- nx configuration end -->
