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

# Prompt for API key name or use default
if [ -z "$1" ]; then
  read -p "Enter a name for the API key: " KEY_NAME
else
  KEY_NAME=$1
  echo "Using API key name: $KEY_NAME"
fi

# Determine which Docmost instance to talk to (default localhost)
DOCMOST_URL=${DOCMOST_URL:-http://localhost:3000}
echo "Using Docmost instance: $DOCMOST_URL"

# Make the request to register an API key
echo "Registering API key..."
response=$(curl -s -X POST "$DOCMOST_URL/api/api-keys/register" \
  -H "Content-Type: application/json" \
  -H "x-registration-token: $APP_SECRET" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"workspaceId\": \"$WORKSPACE_ID\",
    \"name\": \"$KEY_NAME\"
  }")

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
