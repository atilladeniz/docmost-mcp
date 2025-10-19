#!/bin/bash
# Script to register an MCP API key using the registration token

# Load environment variables if .env.mcp exists
if [ -f .env.mcp ]; then
  source .env.mcp
  echo "Loaded environment variables from .env.mcp"
fi

# Determine APP_SECRET source (env, .env, or prompt)
if [ -z "${APP_SECRET:-}" ]; then
  if [ -f .env ]; then
    APP_SECRET=$(grep APP_SECRET .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
  fi
fi

if [ -z "${APP_SECRET:-}" ]; then
  read -r -s -p "Enter APP_SECRET: " APP_SECRET_INPUT
  echo ""
  APP_SECRET=$APP_SECRET_INPUT
fi

if [ -z "$APP_SECRET" ]; then
  echo "Error: APP_SECRET is required"
  exit 1
fi

# Use environment variables if available, otherwise prompt
if [ -n "$MCP_USER_ID" ] && [ -n "$MCP_WORKSPACE_ID" ]; then
  USER_ID=$MCP_USER_ID
  WORKSPACE_ID=$MCP_WORKSPACE_ID
  echo "Using User ID: $USER_ID"
  echo "Using Workspace ID: $WORKSPACE_ID"
else
  # Prompt for user ID and workspace ID
  echo "To create an API key, you need a valid user ID and workspace ID."
  read -p "Enter user ID: " USER_ID
  read -p "Enter workspace ID: " WORKSPACE_ID
fi

# Basic validation to catch common mistakes
if [[ "$USER_ID" == *@* ]]; then
  echo "Error: USER_ID must be the Docmost UUID, not an email address." >&2
  exit 1
fi

if [[ ! $USER_ID =~ ^[0-9a-fA-F-]{10,}$ ]]; then
  echo "Error: USER_ID should look like a UUID (e.g. 01964ade-05df-...)." >&2
  exit 1
fi

if [ -z "$WORKSPACE_ID" ]; then
  echo "Error: Workspace ID is required"
  exit 1
fi

if [[ ! $WORKSPACE_ID =~ ^[0-9a-fA-F-]{10,}$ ]]; then
  echo "Error: Workspace ID should look like a UUID (e.g. 01964ade-05e2-...)." >&2
  exit 1
fi

# Prompt for API key name or use default
if [ -z "$1" ]; then
  read -p "Enter a name for the API key: " KEY_NAME
else
  KEY_NAME=$1
  echo "Using API key name: $KEY_NAME"
fi

# Determine which Docmost instance to talk to (default localhost)
DOCMOST_URL=${DOCMOST_URL:-http://localhost:3000}
DOCMOST_URL=${DOCMOST_URL%/}

DOCMOST_API_PREFIX=${DOCMOST_API_PREFIX:-/api}

if [[ -z "$DOCMOST_API_PREFIX" || "$DOCMOST_API_PREFIX" == "/" ]]; then
  API_PREFIX=""
else
  API_PREFIX="/${DOCMOST_API_PREFIX#/}"
  API_PREFIX=${API_PREFIX%/}
fi

declare -a candidate_paths
candidate_paths=()

if [[ -n "$API_PREFIX" ]]; then
  candidate_paths+=("$API_PREFIX/api-keys/register")
  candidate_paths+=("$API_PREFIX/mcp/api-keys/register")
else
  candidate_paths+=("/api-keys/register")
  candidate_paths+=("/mcp/api-keys/register")
fi

candidate_paths+=("/api/api-keys/register")
candidate_paths+=("/api/mcp/api-keys/register")

REGISTER_URL=""
response=""
http_status=""

for path in "${candidate_paths[@]}"; do
  sanitized="/${path#/}"
  attempt_url="$DOCMOST_URL$sanitized"

  curl_response=$(curl -sS -w "\n%{http_code}" -X POST "$attempt_url" \
    -H "Content-Type: application/json" \
    -H "x-registration-token: $APP_SECRET" \
    -d "{
      \"userId\": \"$USER_ID\",
      \"workspaceId\": \"$WORKSPACE_ID\",
      \"name\": \"$KEY_NAME\"
    }")

  http_status=${curl_response##*$'\n'}
  response=${curl_response%$'\n'*}

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

echo "Using Docmost instance: $REGISTER_URL"

if [[ $http_status != 200 ]]; then
  echo "Error creating API key (status $http_status)" >&2
  echo "Response: $response" >&2
  echo "Please verify the APP_SECRET, API prefix, instance URL, and identifiers." >&2
  exit 1
fi

# Extract the API key from the response
API_KEY=$(echo $response | grep -o '"key":"[^"]*"' | cut -d'"' -f4)

if [ -n "$API_KEY" ]; then
  echo "API key created successfully: $API_KEY"
  echo "You can now use this key to authenticate with the MCP API."
  
  # Save to a file for easy access
  echo "$API_KEY" > .mcp-api-key
  echo "The API key has been saved to .mcp-api-key"
else
  echo "Error creating API key. Response:"
  echo "$response"
fi 
