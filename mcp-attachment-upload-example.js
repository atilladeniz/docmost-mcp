/**
 * Example script demonstrating how to use the MCP to upload attachments
 *
 * This script shows how to:
 * 1. Create an MCP request to upload a file
 * 2. Convert a file to base64 for transmission
 * 3. Handle the response
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

// Example usage
async function exampleUpload() {
  try {
    // Simulating a file input change event
    const fileInput = document.getElementById("file-input");
    const file = fileInput.files[0];

    if (!file) {
      console.error("No file selected");
      return;
    }

    const pageId = "your-page-id"; // Replace with actual page ID
    const workspaceId = "your-workspace-id"; // Replace with actual workspace ID
    const authToken = "your-auth-token"; // Replace with actual auth token

    // Display loading indicator
    console.log("Uploading file...");

    // Upload the file
    const result = await uploadFileMCP(file, pageId, workspaceId, authToken);

    // Handle successful upload
    console.log("File uploaded successfully:", result);

    // You can now use the returned attachment information
    const attachmentId = result.attachment.id;
    const fileName = result.attachment.fileName;

    console.log(`File ${fileName} uploaded with ID ${attachmentId}`);
  } catch (error) {
    console.error("Upload failed:", error);
  }
}

// Example HTML:
/*
<!DOCTYPE html>
<html>
<body>
  <h1>MCP Attachment Upload Example</h1>
  <input type="file" id="file-input">
  <button onclick="exampleUpload()">Upload via MCP</button>
  <div id="result"></div>
  
  <script src="mcp-attachment-upload-example.js"></script>
</body>
</html>
*/
