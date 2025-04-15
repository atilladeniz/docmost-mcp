/**
 * Example script demonstrating how to use the MCP for group operations
 *
 * This script shows how to:
 * 1. List all groups in a workspace
 * 2. Create a new group
 * 3. Add multiple members to a group in a batch
 * 4. Update a group
 * 5. Remove a member from a group
 * 6. Delete a group
 * 7. Use the batch API for multiple operations
 */

// Configuration
const API_ENDPOINT = "/api/mcp";
const AUTH_TOKEN = "your-auth-token"; // Replace with actual auth token
const WORKSPACE_ID = "your-workspace-id"; // Replace with actual workspace ID

/**
 * Send a request to the MCP API
 *
 * @param {Object} request The MCP request
 * @returns {Promise<Object>} The MCP response
 */
async function sendMCPRequest(request) {
  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    body: JSON.stringify(request),
  });

  return await response.json();
}

/**
 * Send a batch of requests to the MCP API
 *
 * @param {Array<Object>} requests The array of MCP requests
 * @returns {Promise<Array<Object>>} The array of MCP responses
 */
async function sendBatchMCPRequest(requests) {
  const response = await fetch(`${API_ENDPOINT}/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    body: JSON.stringify(requests),
  });

  return await response.json();
}

/**
 * List all groups in a workspace
 *
 * @param {string} workspaceId The workspace ID
 * @param {number} page The page number (optional)
 * @param {number} limit The number of groups per page (optional)
 * @param {string} query Search query (optional)
 * @returns {Promise<Object>} The groups and pagination info
 */
async function listGroups(workspaceId, page = 1, limit = 50, query = "") {
  const request = {
    jsonrpc: "2.0",
    method: "group.list",
    params: {
      workspaceId,
      page,
      limit,
      query,
    },
    id: "list-groups-" + Date.now(),
  };

  const response = await sendMCPRequest(request);

  if (response.error) {
    throw new Error(`MCP error: ${response.error.message}`);
  }

  return response.result;
}

/**
 * Get details of a specific group
 *
 * @param {string} groupId The group ID
 * @param {string} workspaceId The workspace ID
 * @returns {Promise<Object>} The group details
 */
async function getGroup(groupId, workspaceId) {
  const request = {
    jsonrpc: "2.0",
    method: "group.get",
    params: {
      groupId,
      workspaceId,
    },
    id: "get-group-" + Date.now(),
  };

  const response = await sendMCPRequest(request);

  if (response.error) {
    throw new Error(`MCP error: ${response.error.message}`);
  }

  return response.result;
}

/**
 * Create a new group
 *
 * @param {string} name The group name
 * @param {string} workspaceId The workspace ID
 * @param {string} description The group description (optional)
 * @param {Array<string>} userIds IDs of users to add to the group (optional)
 * @returns {Promise<Object>} The created group
 */
async function createGroup(name, workspaceId, description = "", userIds = []) {
  const request = {
    jsonrpc: "2.0",
    method: "group.create",
    params: {
      name,
      description,
      userIds,
      workspaceId,
    },
    id: "create-group-" + Date.now(),
  };

  const response = await sendMCPRequest(request);

  if (response.error) {
    throw new Error(`MCP error: ${response.error.message}`);
  }

  return response.result;
}

/**
 * Update a group
 *
 * @param {string} groupId The group ID
 * @param {string} workspaceId The workspace ID
 * @param {string} name The new group name (optional)
 * @param {string} description The new group description (optional)
 * @returns {Promise<Object>} The updated group
 */
async function updateGroup(groupId, workspaceId, name, description) {
  const request = {
    jsonrpc: "2.0",
    method: "group.update",
    params: {
      groupId,
      workspaceId,
      name,
      description,
    },
    id: "update-group-" + Date.now(),
  };

  const response = await sendMCPRequest(request);

  if (response.error) {
    throw new Error(`MCP error: ${response.error.message}`);
  }

  return response.result;
}

/**
 * Add multiple members to a group in a batch
 *
 * @param {string} groupId The group ID
 * @param {string} workspaceId The workspace ID
 * @param {Array<string>} userIds The user IDs to add
 * @returns {Promise<Object>} The result of the operation
 */
async function addGroupMembers(groupId, workspaceId, userIds) {
  const request = {
    jsonrpc: "2.0",
    method: "group.addMember",
    params: {
      groupId,
      workspaceId,
      userIds,
    },
    id: "add-group-members-" + Date.now(),
  };

  const response = await sendMCPRequest(request);

  if (response.error) {
    throw new Error(`MCP error: ${response.error.message}`);
  }

  return response.result;
}

/**
 * Remove a member from a group
 *
 * @param {string} groupId The group ID
 * @param {string} workspaceId The workspace ID
 * @param {string} userId The user ID to remove
 * @returns {Promise<Object>} The result of the operation
 */
async function removeGroupMember(groupId, workspaceId, userId) {
  const request = {
    jsonrpc: "2.0",
    method: "group.removeMember",
    params: {
      groupId,
      workspaceId,
      userId,
    },
    id: "remove-group-member-" + Date.now(),
  };

  const response = await sendMCPRequest(request);

  if (response.error) {
    throw new Error(`MCP error: ${response.error.message}`);
  }

  return response.result;
}

/**
 * Delete a group
 *
 * @param {string} groupId The group ID
 * @param {string} workspaceId The workspace ID
 * @returns {Promise<Object>} The result of the operation
 */
async function deleteGroup(groupId, workspaceId) {
  const request = {
    jsonrpc: "2.0",
    method: "group.delete",
    params: {
      groupId,
      workspaceId,
    },
    id: "delete-group-" + Date.now(),
  };

  const response = await sendMCPRequest(request);

  if (response.error) {
    throw new Error(`MCP error: ${response.error.message}`);
  }

  return response.result;
}

/**
 * Example: Use the batch API to perform multiple group operations
 *
 * @returns {Promise<void>}
 */
async function batchGroupOperationsExample() {
  try {
    // Create multiple batch requests
    const batchRequests = [
      // Request 1: List all groups
      {
        jsonrpc: "2.0",
        method: "group.list",
        params: {
          workspaceId: WORKSPACE_ID,
          page: 1,
          limit: 10,
        },
        id: "batch-list-groups",
      },

      // Request 2: Create a new group
      {
        jsonrpc: "2.0",
        method: "group.create",
        params: {
          name: "Marketing Team",
          description: "Group for marketing team members",
          workspaceId: WORKSPACE_ID,
        },
        id: "batch-create-group",
      },

      // You can add more operations to the batch as needed
    ];

    // Send the batch request
    const batchResponses = await sendBatchMCPRequest(batchRequests);

    // Process the batch responses
    console.log("Batch operations results:");

    batchResponses.forEach((response, index) => {
      if (response.error) {
        console.error(`Request ${index + 1} failed:`, response.error);
      } else {
        console.log(`Request ${index + 1} succeeded:`, response.result);
      }
    });

    // Extract results from specific responses
    const existingGroups = batchResponses[0].result?.groups || [];
    const newGroup = batchResponses[1].result;

    console.log(`Found ${existingGroups.length} existing groups`);

    if (newGroup) {
      console.log(`Created new group: ${newGroup.name} (ID: ${newGroup.id})`);
    }
  } catch (error) {
    console.error("Batch operations failed:", error);
  }
}

/**
 * Example usage
 */
async function runExamples() {
  try {
    // List all groups in the workspace
    console.log("Listing groups...");
    const groupsResult = await listGroups(WORKSPACE_ID);
    console.log(`Found ${groupsResult.groups.length} groups`);

    // Create a new group
    console.log("Creating a new group...");
    const newGroup = await createGroup(
      "Development Team",
      WORKSPACE_ID,
      "Group for development team members"
    );
    console.log(`Created group: ${newGroup.name} with ID: ${newGroup.id}`);

    // Add multiple members to the group
    const userIdsToAdd = ["user1", "user2", "user3"]; // Replace with actual user IDs
    console.log(`Adding ${userIdsToAdd.length} members to the group...`);
    const addMembersResult = await addGroupMembers(
      newGroup.id,
      WORKSPACE_ID,
      userIdsToAdd
    );
    console.log(addMembersResult.message);

    // Update the group
    console.log("Updating the group...");
    const updatedGroup = await updateGroup(
      newGroup.id,
      WORKSPACE_ID,
      "Core Development Team",
      "Group for core development team members"
    );
    console.log(`Updated group name to: ${updatedGroup.name}`);

    // Remove a member from the group
    const userIdToRemove = "user3"; // Replace with actual user ID
    console.log(`Removing user ${userIdToRemove} from the group...`);
    const removeMemberResult = await removeGroupMember(
      newGroup.id,
      WORKSPACE_ID,
      userIdToRemove
    );
    console.log(removeMemberResult.message);

    // Run batch operations example
    console.log("\nRunning batch operations example...");
    await batchGroupOperationsExample();

    // Delete the group (commented out to prevent accidental deletion)
    /*
    console.log("Deleting the group...");
    const deleteResult = await deleteGroup(newGroup.id, WORKSPACE_ID);
    console.log(deleteResult.message);
    */
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run the examples when the script is executed
// runExamples();
