#!/bin/bash

# Color definitions for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Load the API key from the .mcp-api-key file
if [ ! -f .mcp-api-key ]; then
  echo -e "${RED}Error: .mcp-api-key file not found. Please run the register-mcp-api-key.sh script first.${NC}"
  exit 1
fi

API_KEY=$(cat .mcp-api-key)
echo -e "${BLUE}Using API key:${NC} ${API_KEY:0:10}...${API_KEY: -5}"

# Load workspace ID from .env.mcp
if [ ! -f .env.mcp ]; then
  echo -e "${RED}Error: .env.mcp file not found.${NC}"
  exit 1
fi

source .env.mcp
echo -e "${BLUE}Using workspace ID:${NC} $MCP_WORKSPACE_ID"
echo -e "${BLUE}Using user ID:${NC} $MCP_USER_ID"

# Set API endpoint
API_URL="http://127.0.0.1:3000/api/mcp"

# Store created resource IDs for later use
SPACE_ID=""
PAGE_ID=""
GROUP_ID=""
COMMENT_ID=""
FILE_PATH="$(pwd)/test-attachment.txt"

# Extract IDs from response
extract_id() {
  local json_file="$1"
  local default=""
  if [ -f "$json_file" ]; then
    local id=$(jq -r '.id // empty' "$json_file")
    if [ "$id" != "null" ] && [ ! -z "$id" ]; then
      echo "$id"
    else
      echo "$default"
    fi
  else
    echo "$default"
  fi
}

# Function to send an MCP request
send_mcp_request() {
  local method=$1
  local params=$2
  local id=$(date +%s) # Current timestamp in seconds (integer)
  
  echo -e "\n${YELLOW}Testing $method...${NC}"
  
  # Create a temporary file for the request JSON
  local temp_request=$(mktemp)
  
  # Write properly formatted JSON to the temp file
  cat > "$temp_request" << EOF
{
  "jsonrpc": "2.0",
  "method": "$method",
  "params": $params,
  "id": $id
}
EOF

  echo -e "${BLUE}Request:${NC}"
  cat "$temp_request" | jq . || cat "$temp_request"

  # Send request and capture response
  local response=$(curl -s -X POST $API_URL \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d @"$temp_request")
  
  # Clean up temp file
  rm "$temp_request"

  echo -e "${GREEN}Response:${NC}"
  echo "$response" | jq . || echo "$response"
  
  # Extract result for potential use if the response is valid JSON
  if echo "$response" | jq . >/dev/null 2>&1; then
    if echo "$response" | jq -e '.result' >/dev/null 2>&1; then
      echo "$response" | jq '.result' > /tmp/mcp_result.json
    else
      echo "{}" > /tmp/mcp_result.json
    fi
    
    # Check for errors in valid JSON response
    if echo "$response" | jq -e '.error' >/dev/null 2>&1; then
      error_msg=$(echo "$response" | jq -r '.error.message // "Unknown error"')
      echo -e "${RED}ERROR:${NC} $error_msg"
      return 1
    fi
  else
    # Not valid JSON
    echo -e "${RED}ERROR:${NC} Response is not valid JSON"
    echo "{}" > /tmp/mcp_result.json
    return 1
  fi
  
  return 0
}

# Create test file for attachment uploads
create_test_file() {
  echo "This is a test file for MCP API attachment testing." > "$FILE_PATH"
  echo "Created at: $(date)" >> "$FILE_PATH"
  echo "Test file created: $FILE_PATH"
}

# Function to encode file to base64
file_to_base64() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS version of base64
    base64 < "$1" | tr -d '\n'
  else
    # Linux version of base64
    base64 -w 0 "$1"
  fi
}

# Clean up test files
cleanup() {
  echo -e "\n${YELLOW}Cleaning up test files...${NC}"
  if [ -f "$FILE_PATH" ]; then
    rm "$FILE_PATH"
    echo "Removed test file: $FILE_PATH"
  fi
}

# Run tests
run_tests() {
  echo -e "${YELLOW}Starting MCP API tests at $(date)${NC}"
  echo -e "${YELLOW}=======================${NC}"
  
  # -------------------------------------
  # WORKSPACE TESTS
  # -------------------------------------
  echo -e "\n${BLUE}===== WORKSPACE TESTS =====${NC}"
  
  # Get workspace info
  send_mcp_request "workspace.get" "{
    \"workspaceId\": \"$MCP_WORKSPACE_ID\"
  }"
  
  # List workspaces
  send_mcp_request "workspace.list" "{}"
  
  # Update workspace
  send_mcp_request "workspace.update" "{
    \"workspaceId\": \"$MCP_WORKSPACE_ID\",
    \"name\": \"Project89 (MCP Test)\",
    \"description\": \"Updated via MCP API at $(date)\"
  }"
  
  echo -e "${YELLOW}Pausing for 3 seconds to observe UI changes...${NC}"
  sleep 3
  
  # -------------------------------------
  # SPACE TESTS
  # -------------------------------------
  echo -e "\n${BLUE}===== SPACE TESTS =====${NC}"
  
  # List spaces
  send_mcp_request "space.list" "{
    \"workspaceId\": \"$MCP_WORKSPACE_ID\",
    \"page\": 1,
    \"limit\": 10
  }"
  
  # Create a new space
  send_mcp_request "space.create" "{
    \"workspaceId\": \"$MCP_WORKSPACE_ID\",
    \"name\": \"MCP Test Space\",
    \"description\": \"Created via MCP API script\"
  }"
  
  # Get the space ID from the response
  if [ -f /tmp/mcp_result.json ]; then
    SPACE_ID=$(extract_id /tmp/mcp_result.json)
    echo -e "${BLUE}Created Space ID:${NC} $SPACE_ID"
  fi
  
  echo -e "${YELLOW}Pausing for 3 seconds to observe UI changes...${NC}"
  sleep 3
  
  # Get space details
  if [ ! -z "$SPACE_ID" ]; then
    send_mcp_request "space.get" "{
      \"workspaceId\": \"$MCP_WORKSPACE_ID\",
      \"spaceId\": \"$SPACE_ID\"
    }"
    
    # Update space
    send_mcp_request "space.update" "{
      \"workspaceId\": \"$MCP_WORKSPACE_ID\",
      \"spaceId\": \"$SPACE_ID\",
      \"name\": \"MCP Test Space Updated\",
      \"description\": \"Updated via MCP API at $(date)\"
    }"
    
    echo -e "${YELLOW}Pausing for 3 seconds to observe UI changes...${NC}"
    sleep 3
  fi
  
  # -------------------------------------
  # PAGE TESTS
  # -------------------------------------
  echo -e "\n${BLUE}===== PAGE TESTS =====${NC}"
  
  # Create a page in the space
  if [ ! -z "$SPACE_ID" ]; then
    send_mcp_request "page.create" "{
      \"workspaceId\": \"$MCP_WORKSPACE_ID\",
      \"spaceId\": \"$SPACE_ID\",
      \"title\": \"MCP Test Page\",
      \"content\": {
        \"type\": \"doc\",
        \"content\": [
          {
            \"type\": \"paragraph\",
            \"content\": [
              {
                \"type\": \"text\",
                \"text\": \"This page was created via the MCP API at $(date)\"
              }
            ]
          }
        ]
      }
    }"
    
    # Get the page ID from the response
    if [ -f /tmp/mcp_result.json ]; then
      PAGE_ID=$(extract_id /tmp/mcp_result.json)
      echo -e "${BLUE}Created Page ID:${NC} $PAGE_ID"
    fi
    
    echo -e "${YELLOW}Pausing for 3 seconds to observe UI changes...${NC}"
    sleep 3
    
    # List pages in space
    send_mcp_request "page.list" "{
      \"workspaceId\": \"$MCP_WORKSPACE_ID\",
      \"spaceId\": \"$SPACE_ID\",
      \"page\": 1,
      \"limit\": 10
    }"
    
    # Get page details
    if [ ! -z "$PAGE_ID" ]; then
      send_mcp_request "page.get" "{
        \"workspaceId\": \"$MCP_WORKSPACE_ID\",
        \"pageId\": \"$PAGE_ID\"
      }"
      
      # Update page
      send_mcp_request "page.update" "{
        \"workspaceId\": \"$MCP_WORKSPACE_ID\",
        \"pageId\": \"$PAGE_ID\",
        \"title\": \"MCP Test Page Updated\",
        \"content\": {
          \"type\": \"doc\",
          \"content\": [
            {
              \"type\": \"paragraph\",
              \"content\": [
                {
                  \"type\": \"text\",
                  \"text\": \"This page was updated via the MCP API at $(date)\"
                }
              ]
            }
          ]
        }
      }"
      
      echo -e "${YELLOW}Pausing for 3 seconds to observe UI changes...${NC}"
      sleep 3
    fi
  fi
  
  # -------------------------------------
  # USER TESTS
  # -------------------------------------
  echo -e "\n${BLUE}===== USER TESTS =====${NC}"
  
  # List users
  send_mcp_request "user.list" "{
    \"workspaceId\": \"$MCP_WORKSPACE_ID\",
    \"page\": 1,
    \"limit\": 10
  }"
  
  # Get user details
  send_mcp_request "user.get" "{
    \"workspaceId\": \"$MCP_WORKSPACE_ID\",
    \"userId\": \"$MCP_USER_ID\"
  }"
  
  # Update user
  send_mcp_request "user.update" "{
    \"workspaceId\": \"$MCP_WORKSPACE_ID\",
    \"userId\": \"$MCP_USER_ID\",
    \"name\": \"Jakob MCP Test\",
    \"locale\": \"en-US\"
  }"
  
  echo -e "${YELLOW}Pausing for 3 seconds to observe UI changes...${NC}"
  sleep 3
  
  # Reset user name
  send_mcp_request "user.update" "{
    \"workspaceId\": \"$MCP_WORKSPACE_ID\",
    \"userId\": \"$MCP_USER_ID\",
    \"name\": \"Jakob\"
  }"
  
  # -------------------------------------
  # GROUP TESTS
  # -------------------------------------
  echo -e "\n${BLUE}===== GROUP TESTS =====${NC}"
  
  # List groups
  send_mcp_request "group.list" "{
    \"workspaceId\": \"$MCP_WORKSPACE_ID\",
    \"page\": 1,
    \"limit\": 10
  }"
  
  # Create group
  send_mcp_request "group.create" "{
    \"workspaceId\": \"$MCP_WORKSPACE_ID\",
    \"name\": \"MCP Test Group\",
    \"description\": \"Created via MCP API\",
    \"userIds\": [\"$MCP_USER_ID\"]
  }"
  
  # Get the group ID from the response
  if [ -f /tmp/mcp_result.json ]; then
    GROUP_ID=$(extract_id /tmp/mcp_result.json)
    echo -e "${BLUE}Created Group ID:${NC} $GROUP_ID"
  fi
  
  echo -e "${YELLOW}Pausing for 3 seconds to observe UI changes...${NC}"
  sleep 3
  
  # Get group details
  if [ ! -z "$GROUP_ID" ]; then
    send_mcp_request "group.get" "{
      \"workspaceId\": \"$MCP_WORKSPACE_ID\",
      \"groupId\": \"$GROUP_ID\"
    }"
    
    # Update group
    send_mcp_request "group.update" "{
      \"workspaceId\": \"$MCP_WORKSPACE_ID\",
      \"groupId\": \"$GROUP_ID\",
      \"name\": \"MCP Test Group Updated\",
      \"description\": \"Updated via MCP API at $(date)\"
    }"
    
    echo -e "${YELLOW}Pausing for 3 seconds to observe UI changes...${NC}"
    sleep 3
  fi

  # -------------------------------------
  # COMMENT TESTS
  # -------------------------------------
  echo -e "\n${BLUE}===== COMMENT TESTS =====${NC}"
  
  # Create a comment on the page
  if [ ! -z "$PAGE_ID" ]; then
    send_mcp_request "comment.create" "{
      \"workspaceId\": \"$MCP_WORKSPACE_ID\",
      \"pageId\": \"$PAGE_ID\",
      \"content\": {
        \"type\": \"doc\",
        \"content\": [
          {
            \"type\": \"paragraph\",
            \"content\": [
              {
                \"type\": \"text\",
                \"text\": \"This is a test comment created via MCP API at $(date)\"
              }
            ]
          }
        ]
      }
    }"
    
    # Get the comment ID from the response
    if [ -f /tmp/mcp_result.json ]; then
      COMMENT_ID=$(extract_id /tmp/mcp_result.json)
      echo -e "${BLUE}Created Comment ID:${NC} $COMMENT_ID"
    fi
    
    echo -e "${YELLOW}Pausing for 3 seconds to observe UI changes...${NC}"
    sleep 3
    
    # List comments
    send_mcp_request "comment.list" "{
      \"workspaceId\": \"$MCP_WORKSPACE_ID\",
      \"pageId\": \"$PAGE_ID\"
    }"
    
    # Get comment details
    if [ ! -z "$COMMENT_ID" ]; then
      send_mcp_request "comment.get" "{
        \"workspaceId\": \"$MCP_WORKSPACE_ID\",
        \"commentId\": \"$COMMENT_ID\"
      }"
      
      # Update comment
      send_mcp_request "comment.update" "{
        \"workspaceId\": \"$MCP_WORKSPACE_ID\",
        \"commentId\": \"$COMMENT_ID\",
        \"content\": {
          \"type\": \"doc\",
          \"content\": [
            {
              \"type\": \"paragraph\",
              \"content\": [
                {
                  \"type\": \"text\",
                  \"text\": \"This comment was updated via MCP API at $(date)\"
                }
              ]
            }
          ]
        }
      }"
      
      echo -e "${YELLOW}Pausing for 3 seconds to observe UI changes...${NC}"
      sleep 3
    fi
  fi

  # -------------------------------------
  # ATTACHMENT TESTS
  # -------------------------------------
  echo -e "\n${BLUE}===== ATTACHMENT TESTS =====${NC}"
  
  # Create test file
  create_test_file
  
  # Upload attachment if we have a page
  if [ ! -z "$PAGE_ID" ]; then
    # Convert file to base64
    FILE_BASE64=$(file_to_base64 "$FILE_PATH")
    FILE_NAME=$(basename "$FILE_PATH")
    
    send_mcp_request "attachment.upload" "{
      \"workspaceId\": \"$MCP_WORKSPACE_ID\",
      \"pageId\": \"$PAGE_ID\",
      \"spaceId\": \"$SPACE_ID\",
      \"file\": {
        \"name\": \"$FILE_NAME\",
        \"type\": \"text/plain\",
        \"base64\": \"$FILE_BASE64\"
      }
    }"
    
    # Store attachment ID if available
    if [ -f /tmp/mcp_result.json ]; then
      ATTACHMENT_ID=$(extract_id /tmp/mcp_result.json 2>/dev/null)
      if [ "$ATTACHMENT_ID" != "null" ] && [ ! -z "$ATTACHMENT_ID" ]; then
        echo -e "${BLUE}Created Attachment ID:${NC} $ATTACHMENT_ID"
      fi
    fi
    
    echo -e "${YELLOW}Pausing for 3 seconds to observe UI changes...${NC}"
    sleep 3
    
    # List attachments
    send_mcp_request "attachment.list" "{
      \"workspaceId\": \"$MCP_WORKSPACE_ID\",
      \"pageId\": \"$PAGE_ID\"
    }"
  fi

  # -------------------------------------
  # CLEANUP (Optional - comment out if you want to keep the resources)
  # -------------------------------------
  echo -e "\n${BLUE}===== CLEANUP =====${NC}"
  
  # Delete comment if we created one
  if [ ! -z "$COMMENT_ID" ]; then
    send_mcp_request "comment.delete" "{
      \"workspaceId\": \"$MCP_WORKSPACE_ID\",
      \"commentId\": \"$COMMENT_ID\"
    }"
    echo -e "${YELLOW}Pausing for 2 seconds...${NC}"
    sleep 2
  fi
  
  # Delete page if we created one
  if [ ! -z "$PAGE_ID" ]; then
    send_mcp_request "page.delete" "{
      \"workspaceId\": \"$MCP_WORKSPACE_ID\",
      \"pageId\": \"$PAGE_ID\"
    }"
    echo -e "${YELLOW}Pausing for 2 seconds...${NC}"
    sleep 2
  fi
  
  # Delete group if we created one
  if [ ! -z "$GROUP_ID" ]; then
    send_mcp_request "group.delete" "{
      \"workspaceId\": \"$MCP_WORKSPACE_ID\",
      \"groupId\": \"$GROUP_ID\"
    }"
    echo -e "${YELLOW}Pausing for 2 seconds...${NC}"
    sleep 2
  fi
  
  # Delete space if we created one
  if [ ! -z "$SPACE_ID" ]; then
    send_mcp_request "space.delete" "{
      \"workspaceId\": \"$MCP_WORKSPACE_ID\",
      \"spaceId\": \"$SPACE_ID\"
    }"
  fi
  
  # Reset workspace name
  send_mcp_request "workspace.update" "{
    \"workspaceId\": \"$MCP_WORKSPACE_ID\",
    \"name\": \"Project89\",
    \"description\": null
  }"
  
  # Clean up physical files
  cleanup
  
  echo -e "\n${GREEN}All MCP tests completed!${NC}"
}

# Execute tests
run_tests

# Remove temporary files
rm -f /tmp/mcp_result.json 