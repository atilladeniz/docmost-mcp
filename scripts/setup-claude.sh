#!/usr/bin/env bash

set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(cd "$script_dir/.." && pwd)

if ! command -v claude >/dev/null 2>&1; then
  echo "Error: 'claude' CLI not found in PATH. Install Claude Code CLI first." >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "Error: 'curl' is required but not installed." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Error: 'node' (Node.js) is required but not installed." >&2
  exit 1
fi

read -r -p "Docmost base URL [https://docmost.nevuro.com]: " DOCMOST_URL_INPUT
DOCMOST_URL=${DOCMOST_URL_INPUT:-${DOCMOST_URL:-https://docmost.nevuro.com}}

if [[ $DOCMOST_URL != http*://* ]]; then
  echo "Error: Docmost base URL must include http:// or https://" >&2
  exit 1
fi

if [[ -z "${APP_SECRET:-}" ]]; then
  read -r -s -p "Docmost APP_SECRET (hidden input): " APP_SECRET_INPUT
  echo ""
  APP_SECRET=${APP_SECRET_INPUT:-}
fi

if [[ -z "$APP_SECRET" ]]; then
  echo "Error: APP_SECRET is required." >&2
  exit 1
fi

if [[ -z "${MCP_USER_ID:-}" ]]; then
  read -r -p "Docmost user ID to impersonate: " MCP_USER_ID_INPUT
  MCP_USER_ID=${MCP_USER_ID_INPUT:-}
fi

if [[ -z "$MCP_USER_ID" ]]; then
  echo "Error: User ID is required." >&2
  exit 1
fi

if [[ -z "${MCP_WORKSPACE_ID:-}" ]]; then
  read -r -p "Workspace ID for the API key: " MCP_WORKSPACE_ID_INPUT
  MCP_WORKSPACE_ID=${MCP_WORKSPACE_ID_INPUT:-}
fi

if [[ -z "$MCP_WORKSPACE_ID" ]]; then
  echo "Error: Workspace ID is required." >&2
  exit 1
fi

read -r -p "Name for the API key [Claude MCP Bridge]: " KEY_NAME_INPUT
KEY_NAME=${KEY_NAME_INPUT:-Claude MCP Bridge}

read -r -p "Claude server name [docmost]: " MCP_SERVER_NAME_INPUT
MCP_SERVER_NAME=${MCP_SERVER_NAME_INPUT:-docmost}

# Normalize server name for Claude CLI compatibility
MCP_SERVER_NAME=$(echo "$MCP_SERVER_NAME" | tr '[:upper:]' '[:lower:]')
MCP_SERVER_NAME=$(echo "$MCP_SERVER_NAME" | tr -c 'a-z0-9-_' '-')
MCP_SERVER_NAME=${MCP_SERVER_NAME//--/-}
MCP_SERVER_NAME=${MCP_SERVER_NAME##-}
MCP_SERVER_NAME=${MCP_SERVER_NAME%%-}

if [[ -z "$MCP_SERVER_NAME" ]]; then
  echo "Error: Derived Claude server name is empty after normalization." >&2
  exit 1
fi

read -r -p "Enable MCP debug logging? [Y/n]: " DEBUG_PROMPT
DEBUG_PROMPT=${DEBUG_PROMPT:-Y}
case "$DEBUG_PROMPT" in
  [Yy]|[Yy][Ee][Ss]|"") MCP_DEBUG_VALUE=true ;;
  *) MCP_DEBUG_VALUE=false ;;
esac

echo "\nRequesting API key from $DOCMOST_URL ..."

register_payload=$(
  NODE_USER_ID="$MCP_USER_ID" \
  NODE_WORKSPACE_ID="$MCP_WORKSPACE_ID" \
  NODE_KEY_NAME="$KEY_NAME" \
  node - <<'NODE'
const { NODE_USER_ID, NODE_WORKSPACE_ID, NODE_KEY_NAME } = process.env;
console.log(
  JSON.stringify({
    userId: NODE_USER_ID,
    workspaceId: NODE_WORKSPACE_ID,
    name: NODE_KEY_NAME,
  })
);
NODE
)

response=$(curl -sSf -X POST "$DOCMOST_URL/api/api-keys/register" \
  -H "Content-Type: application/json" \
  -H "x-registration-token: $APP_SECRET" \
  -d "$register_payload")

API_KEY=$(printf '%s' "$response" | node -e "const fs=require('fs');const data=fs.readFileSync(0,'utf8');try{const parsed=JSON.parse(data);if(parsed.key){process.stdout.write(parsed.key);}}catch(err){process.exit(1);}")

if [[ -z "$API_KEY" ]]; then
  echo "Error: Could not extract API key from response:" >&2
  echo "$response" >&2
  exit 1
fi

echo "API key created successfully."

bridge_path="$repo_root/packages/mcp-bridge/src/index.ts"

if [[ ! -f "$bridge_path" ]]; then
  echo "Error: MCP bridge entrypoint not found at $bridge_path" >&2
  exit 1
fi

cat <<EOF

Configuring Claude Code server '$MCP_SERVER_NAME'...
EOF

config_json=$(
  NODE_DOCMOST_URL="$DOCMOST_URL" \
  NODE_API_KEY="$API_KEY" \
  NODE_DEBUG="$MCP_DEBUG_VALUE" \
  NODE_BRIDGE_PATH="$bridge_path" \
  node - <<'NODE'
const {
  NODE_DOCMOST_URL,
  NODE_API_KEY,
  NODE_DEBUG,
  NODE_BRIDGE_PATH,
} = process.env;

console.log(
  JSON.stringify({
    type: 'stdio',
    command: 'npx',
    args: ['tsx', NODE_BRIDGE_PATH],
    env: {
      MCP_SERVER_URL: NODE_DOCMOST_URL,
      MCP_API_KEY: NODE_API_KEY,
      MCP_DEBUG: NODE_DEBUG,
    },
  })
);
NODE
)

if claude mcp get "$MCP_SERVER_NAME" >/dev/null 2>&1; then
  echo "An MCP server named '$MCP_SERVER_NAME' already exists. Updating it."
  claude mcp remove "$MCP_SERVER_NAME" >/dev/null 2>&1 || true
fi

claude mcp add-json "$MCP_SERVER_NAME" "$config_json"

cat <<EOF

Claude Code MCP server '$MCP_SERVER_NAME' is ready.

Next steps:
  - Open Claude Code and run /mcp to verify the connection.
  - The API key is stored in Claude's configuration; consider revoking it if compromised.
EOF
