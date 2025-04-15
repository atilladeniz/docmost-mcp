/**
 * Example functions demonstrating how to use the MCP to work with comments
 *
 * This file includes examples for:
 * 1. Creating comments
 * 2. Getting comment details
 * 3. Listing comments for a page
 * 4. Updating comments
 * 5. Deleting comments
 */

// Function to create a comment using MCP
async function createCommentMCP(commentData, authToken) {
  // Create MCP request
  const mcpRequest = {
    jsonrpc: "2.0",
    method: "comment.create",
    params: {
      pageId: commentData.pageId,
      workspaceId: commentData.workspaceId,
      content: commentData.content,
      selection: commentData.selection,
      parentCommentId: commentData.parentCommentId, // Optional, for replies
    },
    id: "create-comment-" + Date.now(),
  };

  // Send the request to the MCP endpoint
  const response = await fetch("/api/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(mcpRequest),
  });

  // Parse and return the response
  const result = await response.json();

  if (result.error) {
    throw new Error(`MCP error: ${result.error.message}`);
  }

  return result.result;
}

// Function to get a comment by ID using MCP
async function getCommentMCP(commentId, workspaceId, authToken) {
  // Create MCP request
  const mcpRequest = {
    jsonrpc: "2.0",
    method: "comment.get",
    params: {
      commentId: commentId,
      workspaceId: workspaceId,
    },
    id: "get-comment-" + Date.now(),
  };

  // Send the request to the MCP endpoint
  const response = await fetch("/api/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(mcpRequest),
  });

  // Parse and return the response
  const result = await response.json();

  if (result.error) {
    throw new Error(`MCP error: ${result.error.message}`);
  }

  return result.result;
}

// Function to list comments for a page using MCP
async function listCommentsMCP(pageId, workspaceId, authToken, options = {}) {
  // Create MCP request
  const mcpRequest = {
    jsonrpc: "2.0",
    method: "comment.list",
    params: {
      pageId: pageId,
      workspaceId: workspaceId,
      page: options.page || 1,
      limit: options.limit || 20,
    },
    id: "list-comments-" + Date.now(),
  };

  // Send the request to the MCP endpoint
  const response = await fetch("/api/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(mcpRequest),
  });

  // Parse and return the response
  const result = await response.json();

  if (result.error) {
    throw new Error(`MCP error: ${result.error.message}`);
  }

  return result.result;
}

// Function to update a comment using MCP
async function updateCommentMCP(commentId, content, workspaceId, authToken) {
  // Create MCP request
  const mcpRequest = {
    jsonrpc: "2.0",
    method: "comment.update",
    params: {
      commentId: commentId,
      workspaceId: workspaceId,
      content: content,
    },
    id: "update-comment-" + Date.now(),
  };

  // Send the request to the MCP endpoint
  const response = await fetch("/api/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(mcpRequest),
  });

  // Parse and return the response
  const result = await response.json();

  if (result.error) {
    throw new Error(`MCP error: ${result.error.message}`);
  }

  return result.result;
}

// Function to delete a comment using MCP
async function deleteCommentMCP(commentId, workspaceId, authToken) {
  // Create MCP request
  const mcpRequest = {
    jsonrpc: "2.0",
    method: "comment.delete",
    params: {
      commentId: commentId,
      workspaceId: workspaceId,
    },
    id: "delete-comment-" + Date.now(),
  };

  // Send the request to the MCP endpoint
  const response = await fetch("/api/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(mcpRequest),
  });

  // Parse and return the response
  const result = await response.json();

  if (result.error) {
    throw new Error(`MCP error: ${result.error.message}`);
  }

  return result.result;
}

// Example usage - Create a new comment
async function exampleCreateComment() {
  try {
    const authToken = "your-auth-token"; // Replace with actual auth token
    const pageId = "page-uuid"; // Replace with actual page ID
    const workspaceId = "workspace-uuid"; // Replace with actual workspace ID

    const commentData = {
      pageId: pageId,
      workspaceId: workspaceId,
      content: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "This is a test comment",
              },
            ],
          },
        ],
      }),
      selection: "Selected text", // Optional, text that was highlighted when commenting
    };

    const result = await createCommentMCP(commentData, authToken);
    console.log("Comment created:", result.comment);

    // Store the comment ID for later use
    const commentId = result.comment.id;

    // You can now use this comment ID for other operations
    return commentId;
  } catch (error) {
    console.error("Error creating comment:", error);
  }
}

// Example usage - Get comment replies
async function exampleListCommentsWithReplies() {
  try {
    const authToken = "your-auth-token"; // Replace with actual auth token
    const pageId = "page-uuid"; // Replace with actual page ID
    const workspaceId = "workspace-uuid"; // Replace with actual workspace ID

    // Get all comments for the page
    const result = await listCommentsMCP(pageId, workspaceId, authToken);

    // Process comments to organize them by parent/child relationship
    const topLevelComments = [];
    const repliesByParentId = {};

    result.comments.forEach((comment) => {
      if (!comment.parentCommentId) {
        // This is a top-level comment
        topLevelComments.push({
          ...comment,
          replies: [],
        });
      } else {
        // This is a reply
        if (!repliesByParentId[comment.parentCommentId]) {
          repliesByParentId[comment.parentCommentId] = [];
        }
        repliesByParentId[comment.parentCommentId].push(comment);
      }
    });

    // Add replies to their parent comments
    topLevelComments.forEach((comment) => {
      if (repliesByParentId[comment.id]) {
        comment.replies = repliesByParentId[comment.id];
      }
    });

    console.log("Comments with replies:", topLevelComments);
    return topLevelComments;
  } catch (error) {
    console.error("Error listing comments:", error);
  }
}

// Example usage - Update a comment
async function exampleUpdateComment(commentId) {
  try {
    const authToken = "your-auth-token"; // Replace with actual auth token
    const workspaceId = "workspace-uuid"; // Replace with actual workspace ID

    // Update the comment content
    const updatedContent = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "This comment has been updated",
            },
          ],
        },
      ],
    });

    const result = await updateCommentMCP(
      commentId,
      updatedContent,
      workspaceId,
      authToken
    );
    console.log("Comment updated:", result.comment);
    return result.comment;
  } catch (error) {
    console.error("Error updating comment:", error);
  }
}

// Example usage - Delete a comment
async function exampleDeleteComment(commentId) {
  try {
    const authToken = "your-auth-token"; // Replace with actual auth token
    const workspaceId = "workspace-uuid"; // Replace with actual workspace ID

    // Delete the comment
    const result = await deleteCommentMCP(commentId, workspaceId, authToken);
    console.log("Comment deleted:", result);
    return result.success;
  } catch (error) {
    console.error("Error deleting comment:", error);
  }
}

// Run a complete example flow
async function runCommentExampleFlow() {
  try {
    // 1. Create a new comment
    console.log("Creating a new comment...");
    const commentId = await exampleCreateComment();

    // 2. Get the comment
    console.log("Getting comment details...");
    const commentDetails = await getCommentMCP(
      commentId,
      "workspace-uuid", // Replace with actual workspace ID
      "your-auth-token" // Replace with actual auth token
    );
    console.log("Comment details:", commentDetails);

    // 3. Update the comment
    console.log("Updating the comment...");
    await exampleUpdateComment(commentId);

    // 4. List all comments (including our updated one)
    console.log("Listing all comments with replies...");
    await exampleListCommentsWithReplies();

    // 5. Delete the comment
    console.log("Deleting the comment...");
    const deleteResult = await exampleDeleteComment(commentId);

    console.log("Comment example flow completed successfully!");
  } catch (error) {
    console.error("Error in example flow:", error);
  }
}

// Call this function to run the complete example flow
// runCommentExampleFlow();
