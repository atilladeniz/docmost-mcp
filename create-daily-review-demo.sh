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
FILE_PATH="$(pwd)/demo-attachment.txt"
SCREENSHOT_PATH="$(pwd)/demo-screenshot.png"

# Today's date in nice format for titles
TODAY=$(date +"%A, %B %d, %Y")

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

# Extract field from response
extract_field() {
  local json_file="$1"
  local field="$2"
  local default=""
  if [ -f "$json_file" ]; then
    local value=$(jq -r ".$field // empty" "$json_file")
    if [ "$value" != "null" ] && [ ! -z "$value" ]; then
      echo "$value"
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
  
  echo -e "\n${YELLOW}Running $method...${NC}"
  
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

  # Send request and capture response
  local response=$(curl -s -X POST $API_URL \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d @"$temp_request")
  
  # Clean up temp file
  rm "$temp_request"

  echo -e "${GREEN}Response received${NC}"
  
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

# Create test files for attachment uploads
create_test_files() {
  # Create a text file with daily update info
  echo "# Daily Status Update" > "$FILE_PATH"
  echo "Date: $(date)" >> "$FILE_PATH"
  echo "## Tasks Completed" >> "$FILE_PATH"
  echo "- Implemented new user onboarding flow" >> "$FILE_PATH"
  echo "- Fixed login issues on mobile devices" >> "$FILE_PATH"
  echo "- Updated documentation for API endpoints" >> "$FILE_PATH"
  echo "## Next Steps" >> "$FILE_PATH"
  echo "- Complete testing for the payment integration" >> "$FILE_PATH"
  echo "- Deploy to staging environment" >> "$FILE_PATH"
  echo "Test file created: $FILE_PATH"
  
  # Create a simple screenshot image (1x1 transparent PNG)
  echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" | base64 -d > "$SCREENSHOT_PATH"
  echo "Screenshot created: $SCREENSHOT_PATH"
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
  if [ -f "$SCREENSHOT_PATH" ]; then
    rm "$SCREENSHOT_PATH"
    echo "Removed screenshot: $SCREENSHOT_PATH"
  fi
}

# Check if the Demo Space already exists
check_demo_space_exists() {
  echo -e "\n${YELLOW}Checking if Daily Review Demo space already exists...${NC}"
  send_mcp_request "space.list" "{
    \"workspaceId\": \"$MCP_WORKSPACE_ID\",
    \"page\": 1,
    \"limit\": 100
  }"
  
  # Extract spaces from result
  local spaces=$(jq -r '.items' /tmp/mcp_result.json)
  
  # Loop through spaces to find "Daily Review Demo"
  if [ "$spaces" != "null" ] && [ ! -z "$spaces" ]; then
    echo "Processing $(jq -r '. | length' <<< "$spaces") spaces..."
    
    for i in $(seq 0 $(jq -r '. | length - 1' <<< "$spaces")); do
      local space_name=$(jq -r ".[$i].name" <<< "$spaces")
      
      if [ "$space_name" == "Daily Review Demo" ]; then
        local space_id=$(jq -r ".[$i].id" <<< "$spaces")
        echo -e "${GREEN}Found existing Daily Review Demo space: $space_id${NC}"
        SPACE_ID="$space_id"
        return 0
      fi
    done
  fi
  
  echo -e "${YELLOW}Daily Review Demo space not found, will create new one.${NC}"
  return 1
}

# Check if a daily review page for today already exists
check_daily_review_page_exists() {
  if [ -z "$SPACE_ID" ]; then
    echo -e "${RED}No space ID available for checking existing pages.${NC}"
    return 1
  fi
  
  echo -e "\n${YELLOW}Checking if Daily Review page for today already exists...${NC}"
  send_mcp_request "page.list" "{
    \"workspaceId\": \"$MCP_WORKSPACE_ID\",
    \"spaceId\": \"$SPACE_ID\",
    \"page\": 1,
    \"limit\": 100
  }"
  
  # Extract pages from result
  local pages=$(jq -r '.items' /tmp/mcp_result.json)
  
  # Today's page title
  local today_title="Daily Team Review - $TODAY"
  
  # Loop through pages to find one with today's date
  if [ "$pages" != "null" ] && [ ! -z "$pages" ]; then
    echo "Processing $(jq -r '. | length' <<< "$pages") pages..."
    
    for i in $(seq 0 $(jq -r '. | length - 1' <<< "$pages")); do
      local page_title=$(jq -r ".[$i].title" <<< "$pages")
      
      if [ "$page_title" == "$today_title" ]; then
        local page_id=$(jq -r ".[$i].id" <<< "$pages")
        echo -e "${GREEN}Found existing Daily Review page for today: $page_id${NC}"
        PAGE_ID="$page_id"
        return 0
      fi
    done
  fi
  
  echo -e "${YELLOW}Daily Review page for today not found, will create new one.${NC}"
  return 1
}

# Create or get the demo space
create_or_get_demo_space() {
  # Check if demo space already exists
  check_demo_space_exists
  
  # If space doesn't exist, create it
  if [ -z "$SPACE_ID" ]; then
    echo -e "\n${YELLOW}Creating Daily Review Demo space...${NC}"
    
    send_mcp_request "space.create" "{
      \"workspaceId\": \"$MCP_WORKSPACE_ID\",
      \"name\": \"Daily Review Demo\",
      \"description\": \"A space for demonstrating real-time document creation\"
    }"
    
    # Get the space ID from the response
    if [ -f /tmp/mcp_result.json ]; then
      SPACE_ID=$(extract_id /tmp/mcp_result.json)
      if [ ! -z "$SPACE_ID" ]; then
        echo -e "${GREEN}Created Demo Space with ID:${NC} $SPACE_ID"
      else
        echo -e "${RED}Failed to create Demo Space.${NC}"
        return 1
      fi
    fi
    
    echo -e "${YELLOW}Pausing for 2 seconds to allow UI to update...${NC}"
    sleep 2
  fi
  
  return 0
}

# Create a rich daily review page with various elements
create_rich_daily_review_page() {
  echo -e "\n${YELLOW}Creating Daily Review page with rich content...${NC}"
  
  send_mcp_request "page.create" "{
    \"workspaceId\": \"$MCP_WORKSPACE_ID\",
    \"spaceId\": \"$SPACE_ID\",
    \"title\": \"Daily Team Review - $TODAY\",
    \"content\": {
      \"type\": \"doc\",
      \"content\": [
        {
          \"type\": \"heading\",
          \"attrs\": { \"level\": 1 },
          \"content\": [
            {
              \"type\": \"text\",
              \"text\": \"Daily Team Review\"
            }
          ]
        },
        {
          \"type\": \"paragraph\",
          \"content\": [
            {
              \"type\": \"text\",
              \"marks\": [{ \"type\": \"bold\" }],
              \"text\": \"Date:\"
            },
            {
              \"type\": \"text\",
              \"text\": \" ${TODAY}\"
            }
          ]
        },
        {
          \"type\": \"heading\",
          \"attrs\": { \"level\": 2 },
          \"content\": [
            {
              \"type\": \"text\",
              \"text\": \"Project Status Update\"
            }
          ]
        },
        {
          \"type\": \"paragraph\",
          \"content\": [
            {
              \"type\": \"text\",
              \"text\": \"This is an automatically generated daily review document created via the Machine Control Protocol (MCP) API. It demonstrates how documents can be programmatically created and updated in real-time.\"
            }
          ]
        },
        {
          \"type\": \"callout\",
          \"attrs\": {
            \"type\": \"info\"
          },
          \"content\": [
            {
              \"type\": \"paragraph\",
              \"content\": [
                {
                  \"type\": \"text\",
                  \"text\": \"The data in this document is being inserted programmatically and updating in real-time without requiring page refresh.\"
                }
              ]
            }
          ]
        },
        {
          \"type\": \"heading\",
          \"attrs\": { \"level\": 2 },
          \"content\": [
            {
              \"type\": \"text\",
              \"text\": \"Tasks Completed\"
            }
          ]
        },
        {
          \"type\": \"taskList\",
          \"content\": [
            {
              \"type\": \"taskItem\",
              \"attrs\": { \"checked\": true },
              \"content\": [
                {
                  \"type\": \"paragraph\",
                  \"content\": [
                    {
                      \"type\": \"text\",
                      \"text\": \"Implement real-time document updates\"
                    }
                  ]
                }
              ]
            },
            {
              \"type\": \"taskItem\",
              \"attrs\": { \"checked\": true },
              \"content\": [
                {
                  \"type\": \"paragraph\",
                  \"content\": [
                    {
                      \"type\": \"text\",
                      \"text\": \"Fix WebSocket connection issues\"
                    }
                  ]
                }
              ]
            },
            {
              \"type\": \"taskItem\",
              \"attrs\": { \"checked\": false },
              \"content\": [
                {
                  \"type\": \"paragraph\",
                  \"content\": [
                    {
                      \"type\": \"text\",
                      \"text\": \"Complete user testing for v2.0 release\"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          \"type\": \"heading\",
          \"attrs\": { \"level\": 2 },
          \"content\": [
            {
              \"type\": \"text\",
              \"text\": \"Project Metrics\"
            }
          ]
        },
        {
          \"type\": \"table\",
          \"content\": [
            {
              \"type\": \"tableRow\",
              \"content\": [
                {
                  \"type\": \"tableHeader\",
                  \"attrs\": { \"colspan\": 1, \"rowspan\": 1 },
                  \"content\": [
                    {
                      \"type\": \"paragraph\",
                      \"content\": [
                        {
                          \"type\": \"text\",
                          \"marks\": [{ \"type\": \"bold\" }],
                          \"text\": \"Metric\"
                        }
                      ]
                    }
                  ]
                },
                {
                  \"type\": \"tableHeader\",
                  \"attrs\": { \"colspan\": 1, \"rowspan\": 1 },
                  \"content\": [
                    {
                      \"type\": \"paragraph\",
                      \"content\": [
                        {
                          \"type\": \"text\",
                          \"marks\": [{ \"type\": \"bold\" }],
                          \"text\": \"Last Week\"
                        }
                      ]
                    }
                  ]
                },
                {
                  \"type\": \"tableHeader\",
                  \"attrs\": { \"colspan\": 1, \"rowspan\": 1 },
                  \"content\": [
                    {
                      \"type\": \"paragraph\",
                      \"content\": [
                        {
                          \"type\": \"text\",
                          \"marks\": [{ \"type\": \"bold\" }],
                          \"text\": \"This Week\"
                        }
                      ]
                    }
                  ]
                },
                {
                  \"type\": \"tableHeader\",
                  \"attrs\": { \"colspan\": 1, \"rowspan\": 1 },
                  \"content\": [
                    {
                      \"type\": \"paragraph\",
                      \"content\": [
                        {
                          \"type\": \"text\",
                          \"marks\": [{ \"type\": \"bold\" }],
                          \"text\": \"Change\"
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              \"type\": \"tableRow\",
              \"content\": [
                {
                  \"type\": \"tableCell\",
                  \"attrs\": { \"colspan\": 1, \"rowspan\": 1 },
                  \"content\": [
                    {
                      \"type\": \"paragraph\",
                      \"content\": [
                        {
                          \"type\": \"text\",
                          \"text\": \"Active Users\"
                        }
                      ]
                    }
                  ]
                },
                {
                  \"type\": \"tableCell\",
                  \"attrs\": { \"colspan\": 1, \"rowspan\": 1 },
                  \"content\": [
                    {
                      \"type\": \"paragraph\",
                      \"content\": [
                        {
                          \"type\": \"text\",
                          \"text\": \"1,245\"
                        }
                      ]
                    }
                  ]
                },
                {
                  \"type\": \"tableCell\",
                  \"attrs\": { \"colspan\": 1, \"rowspan\": 1 },
                  \"content\": [
                    {
                      \"type\": \"paragraph\",
                      \"content\": [
                        {
                          \"type\": \"text\",
                          \"text\": \"1,387\"
                        }
                      ]
                    }
                  ]
                },
                {
                  \"type\": \"tableCell\",
                  \"attrs\": { \"colspan\": 1, \"rowspan\": 1 },
                  \"content\": [
                    {
                      \"type\": \"paragraph\",
                      \"content\": [
                        {
                          \"type\": \"text\",
                          \"marks\": [{ \"type\": \"textStyle\", \"attrs\": { \"color\": \"#2ECC71\" } }],
                          \"text\": \"+11.4%\"
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              \"type\": \"tableRow\",
              \"content\": [
                {
                  \"type\": \"tableCell\",
                  \"attrs\": { \"colspan\": 1, \"rowspan\": 1 },
                  \"content\": [
                    {
                      \"type\": \"paragraph\",
                      \"content\": [
                        {
                          \"type\": \"text\",
                          \"text\": \"Conversion Rate\"
                        }
                      ]
                    }
                  ]
                },
                {
                  \"type\": \"tableCell\",
                  \"attrs\": { \"colspan\": 1, \"rowspan\": 1 },
                  \"content\": [
                    {
                      \"type\": \"paragraph\",
                      \"content\": [
                        {
                          \"type\": \"text\",
                          \"text\": \"3.2%\"
                        }
                      ]
                    }
                  ]
                },
                {
                  \"type\": \"tableCell\",
                  \"attrs\": { \"colspan\": 1, \"rowspan\": 1 },
                  \"content\": [
                    {
                      \"type\": \"paragraph\",
                      \"content\": [
                        {
                          \"type\": \"text\",
                          \"text\": \"3.8%\"
                        }
                      ]
                    }
                  ]
                },
                {
                  \"type\": \"tableCell\",
                  \"attrs\": { \"colspan\": 1, \"rowspan\": 1 },
                  \"content\": [
                    {
                      \"type\": \"paragraph\",
                      \"content\": [
                        {
                          \"type\": \"text\",
                          \"marks\": [{ \"type\": \"textStyle\", \"attrs\": { \"color\": \"#2ECC71\" } }],
                          \"text\": \"+18.8%\"
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          \"type\": \"blockquote\",
          \"content\": [
            {
              \"type\": \"paragraph\",
              \"content\": [
                {
                  \"type\": \"text\",
                  \"text\": \"Our team has made significant progress this week, with key metrics showing positive trends. The real-time collaboration features we've added are already improving team productivity.\"
                }
              ]
            }
          ]
        }
      ]
    }
  }"
  
  # Get the page ID from the response
  if [ -f /tmp/mcp_result.json ]; then
    PAGE_ID=$(extract_id /tmp/mcp_result.json)
    if [ ! -z "$PAGE_ID" ]; then
      echo -e "${GREEN}Created Daily Review page with ID:${NC} $PAGE_ID"
    else
      echo -e "${RED}Failed to create Daily Review page.${NC}"
      return 1
    fi
  fi
  
  echo -e "${YELLOW}Pausing for 3 seconds to observe UI changes...${NC}"
  sleep 3
  
  return 0
}

# Add a comment to the page
add_comment_to_page() {
  if [ -z "$PAGE_ID" ]; then
    echo -e "${RED}No page ID available for adding comment.${NC}"
    return 1
  fi
  
  echo -e "\n${YELLOW}Adding comment to the page...${NC}"
  
  send_mcp_request "comment.create" "{
    \"workspaceId\": \"$MCP_WORKSPACE_ID\",
    \"pageId\": \"$PAGE_ID\",
    \"spaceId\": \"$SPACE_ID\",
    \"content\": {
      \"type\": \"doc\",
      \"content\": [
        {
          \"type\": \"paragraph\",
          \"content\": [
            {
              \"type\": \"text\",
              \"text\": \"Great progress on the metrics! I'm particularly impressed with the conversion rate improvement. Let's discuss what contributed to this in our next meeting.\"
            }
          ]
        },
        {
          \"type\": \"paragraph\",
          \"content\": [
            {
              \"type\": \"text\",
              \"marks\": [{ \"type\": \"bold\" }],
              \"text\": \"Note:\"
            },
            {
              \"type\": \"text\",
              \"text\": \" This comment was automatically added via the MCP API at $(date)\"
            }
          ]
        }
      ]
    }
  }"
  
  # Get the comment ID from the response
  if [ -f /tmp/mcp_result.json ]; then
    COMMENT_ID=$(extract_id /tmp/mcp_result.json)
    if [ ! -z "$COMMENT_ID" ]; then
      echo -e "${GREEN}Added comment with ID:${NC} $COMMENT_ID"
    else
      echo -e "${RED}Failed to add comment.${NC}"
    fi
  fi
  
  echo -e "${YELLOW}Pausing for 2 seconds to observe UI changes...${NC}"
  sleep 2
  
  return 0
}

# Upload attachments to the page
upload_attachments() {
  if [ -z "$PAGE_ID" ] || [ -z "$SPACE_ID" ]; then
    echo -e "${RED}No page or space ID available for uploading attachments.${NC}"
    return 1
  fi
  
  echo -e "\n${YELLOW}Creating test files for attachments...${NC}"
  create_test_files
  
  echo -e "\n${YELLOW}Uploading text file attachment...${NC}"
  
  # Convert file to base64
  FILE_BASE64=$(file_to_base64 "$FILE_PATH")
  FILE_NAME=$(basename "$FILE_PATH")
  FILE_SIZE=$(if [[ "$OSTYPE" == "darwin"* ]]; then stat -f%z "$FILE_PATH"; else stat -c%s "$FILE_PATH"; fi)
  
  send_mcp_request "attachment.upload" "{
    \"workspaceId\": \"$MCP_WORKSPACE_ID\",
    \"pageId\": \"$PAGE_ID\",
    \"spaceId\": \"$SPACE_ID\",
    \"file\": {
      \"name\": \"$FILE_NAME\",
      \"type\": \"text/plain\",
      \"size\": $FILE_SIZE,
      \"base64\": \"$FILE_BASE64\"
    }
  }"
  
  # Store attachment ID if available
  if [ -f /tmp/mcp_result.json ]; then
    TEXT_ATTACHMENT_ID=$(extract_id /tmp/mcp_result.json)
    TEXT_ATTACHMENT_URL=$(extract_field /tmp/mcp_result.json "url")
    if [ ! -z "$TEXT_ATTACHMENT_ID" ]; then
      echo -e "${GREEN}Uploaded text attachment with ID:${NC} $TEXT_ATTACHMENT_ID"
      echo -e "${GREEN}URL:${NC} $TEXT_ATTACHMENT_URL"
    fi
  fi
  
  echo -e "${YELLOW}Pausing for 2 seconds to observe UI changes...${NC}"
  sleep 2
  
  echo -e "\n${YELLOW}Uploading image attachment...${NC}"
  
  # Convert image to base64
  IMAGE_BASE64=$(file_to_base64 "$SCREENSHOT_PATH")
  IMAGE_NAME=$(basename "$SCREENSHOT_PATH")
  IMAGE_SIZE=$(if [[ "$OSTYPE" == "darwin"* ]]; then stat -f%z "$SCREENSHOT_PATH"; else stat -c%s "$SCREENSHOT_PATH"; fi)
  
  send_mcp_request "attachment.upload" "{
    \"workspaceId\": \"$MCP_WORKSPACE_ID\",
    \"pageId\": \"$PAGE_ID\",
    \"spaceId\": \"$SPACE_ID\",
    \"file\": {
      \"name\": \"$IMAGE_NAME\",
      \"type\": \"image/png\",
      \"size\": $IMAGE_SIZE,
      \"base64\": \"$IMAGE_BASE64\"
    }
  }"
  
  # Store attachment ID if available
  if [ -f /tmp/mcp_result.json ]; then
    IMAGE_ATTACHMENT_ID=$(extract_id /tmp/mcp_result.json)
    IMAGE_ATTACHMENT_URL=$(extract_field /tmp/mcp_result.json "url")
    if [ ! -z "$IMAGE_ATTACHMENT_ID" ]; then
      echo -e "${GREEN}Uploaded image attachment with ID:${NC} $IMAGE_ATTACHMENT_ID"
      echo -e "${GREEN}URL:${NC} $IMAGE_ATTACHMENT_URL"
    fi
  fi
  
  echo -e "${YELLOW}Pausing for 2 seconds to observe UI changes...${NC}"
  sleep 2
  
  return 0
}

# Update the page with final content that includes attachments
finalize_page_content() {
  if [ -z "$PAGE_ID" ]; then
    echo -e "${RED}No page ID available for updating final content.${NC}"
    return 1
  fi
  
  echo -e "\n${YELLOW}Updating page with final content including attachments...${NC}"
  
  # Build attachment section based on whether we have attachments
  local attachment_section=""
  if [ ! -z "$TEXT_ATTACHMENT_ID" ] || [ ! -z "$IMAGE_ATTACHMENT_ID" ]; then
    attachment_section=",
        {
          \"type\": \"heading\",
          \"attrs\": { \"level\": 2 },
          \"content\": [
            {
              \"type\": \"text\",
              \"text\": \"Attachments & Resources\"
            }
          ]
        },
        {
          \"type\": \"paragraph\",
          \"content\": [
            {
              \"type\": \"text\",
              \"text\": \"The following files were automatically attached via the MCP API:\"
            }
          ]
        }"
    
    # Add text file attachment if we have one
    if [ ! -z "$TEXT_ATTACHMENT_ID" ] && [ ! -z "$TEXT_ATTACHMENT_URL" ]; then
      attachment_section="${attachment_section},
        {
          \"type\": \"file\",
          \"attrs\": {
            \"id\": \"$TEXT_ATTACHMENT_ID\",
            \"url\": \"$TEXT_ATTACHMENT_URL\", 
            \"filename\": \"$(basename "$FILE_PATH")\",
            \"filesize\": $FILE_SIZE,
            \"uploadProgress\": 100
          }
        }"
    fi
    
    # Add image attachment if we have one
    if [ ! -z "$IMAGE_ATTACHMENT_ID" ] && [ ! -z "$IMAGE_ATTACHMENT_URL" ]; then
      attachment_section="${attachment_section},
        {
          \"type\": \"paragraph\",
          \"content\": [
            {
              \"type\": \"text\",
              \"text\": \"Screenshot of latest dashboard:\"
            }
          ]
        },
        {
          \"type\": \"image\",
          \"attrs\": {
            \"src\": \"$IMAGE_ATTACHMENT_URL\",
            \"alt\": \"Dashboard Screenshot\",
            \"title\": \"Dashboard Screenshot\",
            \"width\": null
          }
        }"
    fi
  fi
  
  # Add a "Next Steps" section with more content
  local next_steps_section=",
        {
          \"type\": \"heading\",
          \"attrs\": { \"level\": 2 },
          \"content\": [
            {
              \"type\": \"text\",
              \"text\": \"Next Steps\"
            }
          ]
        },
        {
          \"type\": \"paragraph\",
          \"content\": [
            {
              \"type\": \"text\",
              \"text\": \"Here's our plan for the rest of the week:\"
            }
          ]
        },
        {
          \"type\": \"bulletList\",
          \"content\": [
            {
              \"type\": \"listItem\",
              \"content\": [
                {
                  \"type\": \"paragraph\",
                  \"content\": [
                    {
                      \"type\": \"text\",
                      \"text\": \"Finalize the v2.0 feature set\"
                    }
                  ]
                }
              ]
            },
            {
              \"type\": \"listItem\",
              \"content\": [
                {
                  \"type\": \"paragraph\",
                  \"content\": [
                    {
                      \"type\": \"text\",
                      \"text\": \"Complete user acceptance testing\"
                    }
                  ]
                }
              ]
            },
            {
              \"type\": \"listItem\",
              \"content\": [
                {
                  \"type\": \"paragraph\",
                  \"content\": [
                    {
                      \"type\": \"text\",
                      \"text\": \"Prepare release notes and documentation\"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          \"type\": \"callout\",
          \"attrs\": {
            \"type\": \"warning\"
          },
          \"content\": [
            {
              \"type\": \"paragraph\",
              \"content\": [
                {
                  \"type\": \"text\",
                  \"marks\": [{ \"type\": \"bold\" }],
                  \"text\": \"Important:\"
                },
                {
                  \"type\": \"text\",
                  \"text\": \" Remember that the staging deployment is scheduled for Friday at 2 PM. Please make sure all critical fixes are committed by Thursday EOD.\"
                }
              ]
            }
          ]
        },
        {
          \"type\": \"paragraph\",
          \"content\": [
            {
              \"type\": \"text\",
              \"text\": \"Last updated: $(date)\"
            }
          ]
        }"
  
  # Combine all content sections
  local combined_content="${attachment_section}${next_steps_section}"
  
  # Update the page with the new content
  send_mcp_request "page.update" "{
    \"workspaceId\": \"$MCP_WORKSPACE_ID\",
    \"pageId\": \"$PAGE_ID\",
    \"appendContent\": true,
    \"content\": {
      \"type\": \"doc\",
      \"content\": [${combined_content:1}]
    }
  }"
  
  echo -e "${YELLOW}Pausing for 3 seconds to observe UI changes...${NC}"
  sleep 3
  
  return 0
}

# Main function
main() {
  echo -e "${YELLOW}Starting Daily Review Document Demo at $(date)${NC}"
  echo -e "${YELLOW}=======================${NC}"
  
  # Create or get the demo space
  create_or_get_demo_space
  
  if [ -z "$SPACE_ID" ]; then
    echo -e "${RED}Failed to create or get demo space. Exiting.${NC}"
    exit 1
  fi
  
  # Create or get the daily review page
  check_daily_review_page_exists
  
  # If page doesn't exist, create it
  if [ -z "$PAGE_ID" ]; then
    create_rich_daily_review_page
    
    if [ -z "$PAGE_ID" ]; then
      echo -e "${RED}Failed to create daily review page. Exiting.${NC}"
      exit 1
    fi
    
    # Add a comment to the page
    add_comment_to_page
    
    # Upload attachments
    upload_attachments
    
    # Update the page with final content that includes attachments
    finalize_page_content
    
    echo -e "\n${GREEN}Daily Review Document created successfully!${NC}"
  else
    echo -e "\n${GREEN}Using existing Daily Review Document for today.${NC}"
  fi
  
  echo -e "${BLUE}Space ID:${NC} $SPACE_ID"
  echo -e "${BLUE}Page ID:${NC} $PAGE_ID"
  
  # Clean up physical files
  cleanup
  
  echo -e "\n${GREEN}Document creation complete!${NC}"
  echo -e "${BLUE}You can view the created document in the 'Daily Review Demo' space.${NC}"
}

# Execute main function
main

# Remove temporary files
rm -f /tmp/mcp_result.json 