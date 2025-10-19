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

# Normalize URL (strip trailing slash)
DOCMOST_URL=${DOCMOST_URL%/}

read -r -p "Docmost API prefix [/api]: " DOCMOST_API_PREFIX_INPUT
DOCMOST_API_PREFIX=${DOCMOST_API_PREFIX_INPUT:-${DOCMOST_API_PREFIX:-/api}}

if [[ -z "$DOCMOST_API_PREFIX" || "$DOCMOST_API_PREFIX" == "/" ]]; then
  API_PREFIX=""
else
  API_PREFIX="/${DOCMOST_API_PREFIX#/}"
  API_PREFIX=${API_PREFIX%/}
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

if [[ "$MCP_USER_ID" == *@* ]]; then
  echo "Error: The user ID must be the Docmost UUID, not an email address." >&2
  exit 1
fi

if [[ ! $MCP_USER_ID =~ ^[0-9a-fA-F-]{10,}$ ]]; then
  echo "Error: The user ID should look like a UUID (e.g. 01964ade-05df-...)." >&2
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

if [[ ! $MCP_WORKSPACE_ID =~ ^[0-9a-fA-F-]{10,}$ ]]; then
  echo "Error: The workspace ID should look like a UUID (e.g. 01964ade-05e2-...)." >&2
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

echo "\nLooking for registration endpoint on $DOCMOST_URL ..."

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

declare -a candidate_paths
candidate_paths=()

if [[ -n "$API_PREFIX" ]]; then
  candidate_paths+=("$API_PREFIX/api-keys/register")
  candidate_paths+=("$API_PREFIX/mcp/api-keys/register")
else
  candidate_paths+=("/api-keys/register")
  candidate_paths+=("/mcp/api-keys/register")
fi

# Always try the default paths as fallbacks
candidate_paths+=("/api/api-keys/register")
candidate_paths+=("/api/mcp/api-keys/register")

response_body=""
REGISTER_URL=""
http_status=""

for path in "${candidate_paths[@]}"; do
  sanitized="/${path#/}"
  attempt_url="$DOCMOST_URL$sanitized"

  curl_response=$(curl -sS -w "\n%{http_code}" -X POST "$attempt_url" \
    -H "Content-Type: application/json" \
    -H "x-registration-token: $APP_SECRET" \
    -d "$register_payload")

  http_status=${curl_response##*$'\n'}
  response_body=${curl_response%$'\n'*}

  if [[ $http_status == 404 ]]; then
    echo "  • $attempt_url -> 404 (not found), trying next option..."
    continue
  fi

  REGISTER_URL=$attempt_url
  break
done

if [[ -z "$REGISTER_URL" ]]; then
  echo "Error: Could not find a working registration endpoint." >&2
  echo "Tried the following paths:" >&2
  printf '  - %s\n' "${candidate_paths[@]}" >&2
  exit 1
fi

if [[ $http_status != 200 ]]; then
  echo "Error: API key request failed with status $http_status" >&2
  echo "Endpoint: $REGISTER_URL" >&2
  echo "Response body: $response_body" >&2
  echo "\nHints:" >&2
  echo "  • Double-check that the APP_SECRET matches the server configuration." >&2
  echo "  • Ensure the Docmost base URL and API prefix target the correct host." >&2
  echo "  • Confirm the user and workspace IDs belong to the target instance." >&2
  exit 1
fi

echo "  • Using registration endpoint: $REGISTER_URL"

API_KEY=$(printf '%s' "$response_body" | node -e "const fs=require('fs');const data=fs.readFileSync(0,'utf8');try{const parsed=JSON.parse(data);if(parsed.key){process.stdout.write(parsed.key);}}catch(err){process.exit(1);}")

if [[ -z "$API_KEY" ]]; then
  echo "Error: Could not extract API key from response:" >&2
  echo "$response_body" >&2
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
