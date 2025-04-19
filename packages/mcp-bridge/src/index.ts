import { McpServer } from "@modelcontextprotocol/sdk";
import { z } from "zod";
import axios from "axios";

// Initialize MCP server with a name and version
const server = new McpServer({
  name: "docmost",
  version: "0.1.0",
});

// Configure server with environment variables
const config = {
  serverUrl: process.env.MCP_SERVER_URL || "http://localhost:3000",
  apiKey: process.env.MCP_API_KEY,
  userId: process.env.MCP_USER_ID,
  workspaceId: process.env.MCP_WORKSPACE_ID,
  userEmail: process.env.MCP_USER_EMAIL,
};

// Create API client
const api = axios.create({
  baseURL: config.serverUrl,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  },
});

// Type definitions
interface SpaceCreateParams {
  name: string;
  description?: string;
}

interface PageCreateParams {
  spaceId: string;
  title: string;
  content?: string;
}

// Register tools following the documentation example
server.registerTool("space.create", {
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
  }),
  handler: async (params) => {
    const response = await api.post("/api/spaces", params);
    return response.data;
  },
});

server.registerTool("space.list", {
  schema: z.object({}),
  handler: async () => {
    const response = await api.get("/api/spaces");
    return response.data;
  },
});

server.registerTool("page.create", {
  schema: z.object({
    spaceId: z.string(),
    title: z.string(),
    content: z.string().optional(),
  }),
  handler: async (params) => {
    const response = await api.post("/api/pages", params);
    return response.data;
  },
});

// Start the server with stdio transport
server.start("stdio");
