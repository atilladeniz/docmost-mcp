# Docmost Machine Control Protocol (MCP)

## Introduction

The Machine Control Protocol (MCP) is an initiative to add programmatic control capabilities to Docmost, allowing external systems and automation tools to interact with all Docmost functionalities.

## What is MCP?

MCP is a JSON-RPC 2.0 based protocol that enables:

- Creating, reading, updating, and deleting Docmost resources
- Real-time interactions with the Docmost platform
- Automation of workflows
- Integration with external systems and tools

## Why MCP?

Docmost is a powerful documentation and collaboration platform, but currently lacks a comprehensive API for machine control. The MCP initiative aims to fill this gap by providing:

1. **Automation Capabilities**: Enable users to automate repetitive tasks
2. **Integration Possibilities**: Allow Docmost to work seamlessly with other tools in the user's workflow
3. **Extensibility**: Enable the development of third-party plugins and extensions
4. **Machine-to-Machine Communication**: Support AI-driven workflows and bot interactions

## Getting Started

### For Users

Once the MCP implementation is complete, you'll be able to use it by:

1. Obtaining an MCP API token from your Docmost workspace settings
2. Using one of our client SDKs or making direct API calls
3. Following the MCP API documentation

### For Developers

If you're interested in contributing to the MCP implementation:

1. Review the [MCP Implementation Plan](./mcp-implementation-plan.md)
2. Set up the Docmost development environment following the [official documentation](https://docmost.com/docs/self-hosting/development/)
3. Check the progress tracking section to identify areas where you can contribute

## Implementation Status

The MCP implementation is currently in the planning phase. For detailed information about the implementation plan and progress, please refer to the [MCP Implementation Plan](./mcp-implementation-plan.md).

## Examples

Here's a simple example of how MCP could be used to create a new page:

```javascript
// Example: Creating a new page via MCP
const mcpRequest = {
  jsonrpc: "2.0",
  method: "page.create",
  params: {
    spaceId: "space-123",
    title: "My New Page",
    content: "This is the content of my new page",
    parentPageId: "parent-page-456" // Optional
  },
  id: "request-1"
};

// Sending the request
const response = await fetch("https://example.docmost.com/api/mcp", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_MCP_TOKEN"
  },
  body: JSON.stringify(mcpRequest)
});

const result = await response.json();
// result.result will contain the created page information
```

## Future Roadmap

After the initial MCP implementation, we plan to:

1. Develop language-specific SDKs (JavaScript, Python, Go, etc.)
2. Provide integration examples with popular tools and platforms
3. Support webhook capabilities for event-driven architectures
4. Create a plugin marketplace for MCP-based extensions

## Contributing

Contributions to the MCP initiative are welcome! Please check the [MCP Implementation Plan](./mcp-implementation-plan.md) to see where help is needed.

## License

The MCP implementation is part of the Docmost project and follows the same licensing terms.

---

For more information about Docmost, visit [docmost.com](https://docmost.com). 