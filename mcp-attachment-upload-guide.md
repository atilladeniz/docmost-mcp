# Working with Attachments using Docmost Machine Control Protocol (MCP)

This guide explains how to work with file attachments programmatically using the Docmost Machine Control Protocol (MCP).

## Overview

The MCP allows you to interact with all Docmost functionalities programmatically, including file attachments. The following operations are supported:

- `attachment.upload` - Upload a file to a page
- `attachment.download` - Download a file
- `attachment.delete` - Delete an attachment
- `attachment.list` - List attachments with pagination
- `attachment.get` - Get attachment metadata

## Authentication

Before using the MCP, you need to authenticate and obtain an access token. All MCP requests require a valid JWT token in the Authorization header.

## Upload Operation

### Request Format

```json
{
  "jsonrpc": "2.0",
  "method": "attachment.upload",
  "params": {
    "workspaceId": "your-workspace-id",
    "pageId": "your-page-id",
    "fileName": "example.pdf",
    "mimeType": "application/pdf",
    "fileContent": "base64-encoded-file-content"
  },
  "id": "request-id"
}
```

### Required Parameters for Upload

- `workspaceId` - The ID of the workspace where the attachment will be uploaded
- `pageId` - The ID of the page where the attachment will be associated
- `fileName` - The name of the file including its extension
- `fileContent` - The file content encoded as a base64 string

### Optional Parameters for Upload

- `mimeType` - The MIME type of the file (if not provided, it will be inferred from the file extension)
- `attachmentId` - If updating an existing attachment, provide its ID

## Download Operation

### Request Format

```json
{
  "jsonrpc": "2.0",
  "method": "attachment.download",
  "params": {
    "workspaceId": "your-workspace-id",
    "attachmentId": "your-attachment-id",
    "includeDataUrl": true
  },
  "id": "request-id"
}
```

### Required Parameters for Download

- `workspaceId` - The ID of the workspace containing the attachment
- `attachmentId` - The ID of the attachment to download

### Optional Parameters for Download

- `includeDataUrl` - If set to true, the returned content will be in Data URL format (e.g., `data:application/pdf;base64,...`). If false, raw base64 is returned.

## Delete Operation

### Request Format

```json
{
  "jsonrpc": "2.0",
  "method": "attachment.delete",
  "params": {
    "workspaceId": "your-workspace-id",
    "attachmentId": "your-attachment-id"
  },
  "id": "request-id"
}
```

### Required Parameters for Delete

- `workspaceId` - The ID of the workspace containing the attachment
- `attachmentId` - The ID of the attachment to delete

## Response Formats

### Upload Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "attachment": {
      "id": "attachment-uuid",
      "fileName": "example.pdf",
      "fileSize": 12345,
      "fileExt": "pdf",
      "mimeType": "application/pdf",
      "type": "file",
      "creatorId": "user-uuid",
      "pageId": "page-uuid",
      "spaceId": "space-uuid",
      "workspaceId": "workspace-uuid",
      "createdAt": "2023-05-01T12:00:00.000Z",
      "updatedAt": "2023-05-01T12:00:00.000Z"
    }
  },
  "id": "request-id"
}
```

### Download Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "attachment": {
      "id": "attachment-uuid",
      "fileName": "example.pdf",
      "fileSize": 12345,
      "fileExt": "pdf",
      "mimeType": "application/pdf",
      "content": "base64-encoded-content-or-data-url"
    }
  },
  "id": "request-id"
}
```

### Delete Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "message": "Attachment example.pdf deleted successfully"
  },
  "id": "request-id"
}
```

## Example Implementation

Here are examples of how to use the attachment operations with JavaScript:

### Upload Example

```javascript
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
      fileContent: fileBase64
    },
    id: "upload-" + Date.now()
  };

  // Send the request to the MCP endpoint
  const response = await fetch("/api/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`
    },
    body: JSON.stringify(mcpRequest)
  });

  // Parse and return the response
  const result = await response.json();
  
  if (result.error) {
    throw new Error(`MCP error: ${result.error.message}`);
  }
  
  return result.result;
}

// Helper function to convert a file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}
```

### Download Example

```javascript
async function downloadFileMCP(attachmentId, workspaceId, authToken, includeDataUrl = true) {
  // Create MCP request
  const mcpRequest = {
    jsonrpc: "2.0",
    method: "attachment.download",
    params: {
      workspaceId: workspaceId,
      attachmentId: attachmentId,
      includeDataUrl: includeDataUrl // Set to true to get a data URL format, false for raw base64
    },
    id: "download-" + Date.now()
  };

  // Send the request to the MCP endpoint
  const response = await fetch("/api/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`
    },
    body: JSON.stringify(mcpRequest)
  });

  // Parse and return the response
  const result = await response.json();
  
  if (result.error) {
    throw new Error(`MCP error: ${result.error.message}`);
  }
  
  return result.result;
}

// Example usage: Download and display an image
async function displayImage(attachmentId, workspaceId, authToken) {
  const result = await downloadFileMCP(attachmentId, workspaceId, authToken);
  
  // Create an image element and set its source to the data URL
  const img = document.createElement('img');
  img.src = result.attachment.content;
  document.getElementById('imageContainer').appendChild(img);
}

// Example usage: Download and save a file
async function saveFile(attachmentId, workspaceId, authToken) {
  const result = await downloadFileMCP(attachmentId, workspaceId, authToken);
  
  // Create a download link
  const link = document.createElement('a');
  link.href = result.attachment.content;
  link.download = result.attachment.fileName;
  
  // Trigger the download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

### Delete Example

```javascript
async function deleteAttachmentMCP(attachmentId, workspaceId, authToken) {
  // Create MCP request
  const mcpRequest = {
    jsonrpc: "2.0",
    method: "attachment.delete",
    params: {
      workspaceId: workspaceId,
      attachmentId: attachmentId
    },
    id: "delete-" + Date.now()
  };

  // Send the request to the MCP endpoint
  const response = await fetch("/api/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`
    },
    body: JSON.stringify(mcpRequest)
  });

  // Parse and return the response
  const result = await response.json();
  
  if (result.error) {
    throw new Error(`MCP error: ${result.error.message}`);
  }
  
  return result.result;
}
```

## Error Handling

If an error occurs, the response will contain an error object:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": "workspaceId is required"
  },
  "id": "request-id"
}
```

Common error codes:

- `-32700`: Parse error
- `-32600`: Invalid request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error
- `-32001`: Resource not found
- `-32002`: Permission denied

## Permissions

To work with attachments, users must have the appropriate permission levels:

- `attachment.upload`: Requires WRITE permission level
- `attachment.download`: Requires READ permission level
- `attachment.delete`: Requires WRITE permission level
- `attachment.list`: Requires READ permission level
- `attachment.get`: Requires READ permission level

Additionally, the user must have permission to access the page where the attachment is located.

## File Size Limits

The file size limit is governed by the `FILE_UPLOAD_SIZE_LIMIT` environment variable. The default limit is 50MB.

## Related Documentation

For more information about the Docmost Machine Control Protocol, see the [MCP Documentation](https://docmost.com/docs/api/mcp). 