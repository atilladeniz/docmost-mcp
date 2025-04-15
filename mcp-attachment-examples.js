/**
 * Example functions demonstrating how to use the MCP to work with attachments
 *
 * This file includes examples for:
 * 1. Uploading attachments
 * 2. Downloading attachments
 * 3. Deleting attachments
 * 4. Listing attachments
 */

// Function to convert a file to base64
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

// Function to upload a file using MCP
async function uploadFileMCP(file, pageId, workspaceId, authToken) {
  // Convert file to base64
  const fileBase64 = await fileToBase64(file);

  // Create MCP request
  const mcpRequest = {
    jsonrpc: "2.0",
    method: "attachment.upload",
    params: {
      workspaceId: workspaceId,
      pageId: pageId,
      fileName: file.name,
      mimeType: file.type,
      fileContent: fileBase64,
    },
    id: "upload-" + Date.now(),
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

// Function to download a file using MCP
async function downloadFileMCP(
  attachmentId,
  workspaceId,
  authToken,
  includeDataUrl = true
) {
  // Create MCP request
  const mcpRequest = {
    jsonrpc: "2.0",
    method: "attachment.download",
    params: {
      workspaceId: workspaceId,
      attachmentId: attachmentId,
      includeDataUrl: includeDataUrl, // Set to true to get a data URL format, false for raw base64
    },
    id: "download-" + Date.now(),
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

// Function to delete an attachment using MCP
async function deleteAttachmentMCP(attachmentId, workspaceId, authToken) {
  // Create MCP request
  const mcpRequest = {
    jsonrpc: "2.0",
    method: "attachment.delete",
    params: {
      workspaceId: workspaceId,
      attachmentId: attachmentId,
    },
    id: "delete-" + Date.now(),
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

// Function to list attachments using MCP
async function listAttachmentsMCP(workspaceId, authToken, options = {}) {
  // Create MCP request with optional parameters
  const mcpRequest = {
    jsonrpc: "2.0",
    method: "attachment.list",
    params: {
      workspaceId: workspaceId,
      page: options.page || 1,
      limit: options.limit || 20,
      spaceId: options.spaceId,
      pageId: options.pageId,
      query: options.query,
    },
    id: "list-" + Date.now(),
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

// Example usage - Download and view an image
async function exampleDownloadImage() {
  try {
    const attachmentId = "your-attachment-id";
    const workspaceId = "your-workspace-id";
    const authToken = "your-auth-token";

    // Download the image
    const result = await downloadFileMCP(attachmentId, workspaceId, authToken);

    // If it's an image and includeDataUrl was true, you can display it directly
    const imageContainer = document.getElementById("image-container");
    const img = document.createElement("img");
    img.src = result.attachment.content; // This is already a data URL
    imageContainer.appendChild(img);

    console.log("Image downloaded and displayed");
  } catch (error) {
    console.error("Download failed:", error);
  }
}

// Example usage - Download and save a file
async function exampleDownloadAndSaveFile() {
  try {
    const attachmentId = "your-attachment-id";
    const workspaceId = "your-workspace-id";
    const authToken = "your-auth-token";

    // Download the file
    const result = await downloadFileMCP(attachmentId, workspaceId, authToken);

    // Create a download link
    const fileName = result.attachment.fileName;
    const link = document.createElement("a");
    link.href = result.attachment.content; // This is a data URL if includeDataUrl was true
    link.download = fileName;

    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`File ${fileName} downloaded`);
  } catch (error) {
    console.error("Download failed:", error);
  }
}

// Example usage - Delete an attachment
async function exampleDeleteAttachment() {
  try {
    const attachmentId = "your-attachment-id";
    const workspaceId = "your-workspace-id";
    const authToken = "your-auth-token";

    // Confirm before deleting
    if (!confirm("Are you sure you want to delete this attachment?")) {
      return;
    }

    // Delete the attachment
    const result = await deleteAttachmentMCP(
      attachmentId,
      workspaceId,
      authToken
    );

    // Handle success
    console.log(result.message);
    alert("Attachment deleted successfully");

    // Update UI if needed
    const attachmentElement = document.getElementById(
      `attachment-${attachmentId}`
    );
    if (attachmentElement) {
      attachmentElement.remove();
    }
  } catch (error) {
    console.error("Deletion failed:", error);
    alert(`Failed to delete attachment: ${error.message}`);
  }
}
