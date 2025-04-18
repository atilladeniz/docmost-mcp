#!/usr/bin/env node
/**
 * Docmost Model Context Protocol (MCP) Cursor SDK
 *
 * This script creates a bridge between Cursor's Model Context Protocol (MCP) tool format
 * and the existing Docmost Machine Control Protocol server.
 */

const http = require("http");
const fs = require("fs");
const express = require("express");
const { z } = require("zod");

// Read API key from file
const API_KEY = fs.readFileSync(".mcp-api-key", "utf8").trim();

// Create express app
const app = express();
app.use(express.json());

// Add CORS support
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Create MCP server
const server = {
  _tools: new Map(),

  /**
   * Register a tool with the MCP server
   */
  tool({ name, description, inputSchema, handler }) {
    this._tools.set(name, { name, description, inputSchema, handler });
    console.log(`Registered tool: ${name}`);
    return this;
  },

  /**
   * Start the MCP server
   */
  start(port = 3002) {
    // Create tools endpoint at multiple paths to ensure Cursor can find it
    const toolsResponse = () => {
      const tools = Array.from(this._tools.values()).map((tool) => {
        // Convert tool registration to OpenAI function format
        return {
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema?.shape
              ? zodToJsonSchema(tool.inputSchema)
              : { type: "object", properties: {} },
          },
        };
      });

      return {
        schema_version: "1.0",
        name_for_model: "Docmost MCP",
        name_for_human: "Docmost Model Context Protocol",
        tools,
      };
    };

    // Expose tools at multiple endpoints to maximize compatibility
    app.get("/tools", (req, res) => res.json(toolsResponse()));
    app.get("/", (req, res) => res.json(toolsResponse()));
    app.get("/api/tools", (req, res) => res.json(toolsResponse()));

    // Create execute endpoint at multiple paths
    const executeHandler = async (req, res) => {
      const { name, arguments: args } = req.body;

      // Get tool
      const tool = this._tools.get(name);
      if (!tool) {
        return res.status(404).json({ error: `Tool '${name}' not found` });
      }

      try {
        // Validate input if schema exists
        let validatedArgs = args;
        if (tool.inputSchema) {
          validatedArgs = tool.inputSchema.parse(args);
        }

        // Execute handler
        const result = await tool.handler(validatedArgs);
        res.json({ result });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    };

    app.post("/execute", executeHandler);
    app.post("/api/execute", executeHandler);
    app.post("/", executeHandler);

    // Add status and health endpoints
    app.get("/status", (req, res) => {
      res.json({
        status: "running",
        toolCount: this._tools.size,
        tools: Array.from(this._tools.keys()),
      });
    });

    app.get("/health", (req, res) => {
      res.json({ status: "ok" });
    });

    // Start server
    app.listen(port, () => {
      console.log(`MCP Cursor SDK running at http://localhost:${port}`);
      console.log(
        `Available tools: ${Array.from(this._tools.keys()).join(", ")}`
      );
      console.log(`Try accessing tools at: http://localhost:${port}/tools`);
    });
  },
};

// Helper to convert Zod schema to JSON Schema
function zodToJsonSchema(zodSchema) {
  // Basic conversion - in a real implementation, you'd want a more robust converter
  const shape = zodSchema.shape || {};
  const properties = {};
  const required = [];

  Object.entries(shape).forEach(([key, value]) => {
    // Very simple type mapping
    let type = "string";

    if (value instanceof z.ZodString) {
      type = "string";
    } else if (value instanceof z.ZodNumber) {
      type = "number";
    } else if (value instanceof z.ZodBoolean) {
      type = "boolean";
    } else if (value instanceof z.ZodObject) {
      type = "object";
    } else if (value instanceof z.ZodArray) {
      type = "array";
    }

    properties[key] = { type };

    // If not optional, add to required
    if (!value.isOptional?.()) {
      required.push(key);
    }
  });

  return {
    type: "object",
    properties,
    required,
  };
}

// Register tools
function registerTools() {
  // System tools
  registerSystemListMethodsTool();
  registerSystemGetMethodSchemaTool();

  // Context tools
  registerContextSetTool();
  registerContextGetTool();
  registerContextDeleteTool();
  registerContextListTool();
  registerContextClearTool();

  // Space tools
  registerSpaceCreateTool();
  registerSpaceListTool();

  // Page tools
  registerPageCreateTool();
}

// System methods
function registerSystemListMethodsTool() {
  server.tool({
    name: "system.listMethods",
    description: "List all available MCP methods with their categories",
    handler: async () => {
      return callMCPMethod("system.listMethods", {});
    },
  });
}

function registerSystemGetMethodSchemaTool() {
  server.tool({
    name: "system.getMethodSchema",
    description: "Get detailed schema information for a specific method",
    inputSchema: z.object({
      methodName: z
        .string()
        .describe("Name of the method to retrieve schema for"),
    }),
    handler: async ({ methodName }) => {
      return callMCPMethod("system.getMethodSchema", { methodName });
    },
  });
}

// Context methods
function registerContextSetTool() {
  server.tool({
    name: "context.set",
    description: "Store context data with optional TTL",
    inputSchema: z.object({
      key: z.string().describe("Context key"),
      value: z.any().describe("Context value"),
      ttl: z.number().optional().describe("Time-to-live in seconds"),
    }),
    handler: async ({ key, value, ttl }) => {
      return callMCPMethod("context.set", { key, value, ttl });
    },
  });
}

function registerContextGetTool() {
  server.tool({
    name: "context.get",
    description: "Retrieve context data",
    inputSchema: z.object({
      key: z.string().describe("Context key"),
    }),
    handler: async ({ key }) => {
      return callMCPMethod("context.get", { key });
    },
  });
}

function registerContextDeleteTool() {
  server.tool({
    name: "context.delete",
    description: "Delete context data",
    inputSchema: z.object({
      key: z.string().describe("Context key"),
    }),
    handler: async ({ key }) => {
      return callMCPMethod("context.delete", { key });
    },
  });
}

function registerContextListTool() {
  server.tool({
    name: "context.list",
    description: "List all context keys",
    handler: async () => {
      return callMCPMethod("context.list", {});
    },
  });
}

function registerContextClearTool() {
  server.tool({
    name: "context.clear",
    description: "Clear all context data",
    handler: async () => {
      return callMCPMethod("context.clear", {});
    },
  });
}

// Space methods
function registerSpaceCreateTool() {
  server.tool({
    name: "space.create",
    description: "Creates a new workspace space for organizing documents",
    inputSchema: z.object({
      workspaceId: z.string().describe("UUID of the workspace"),
      name: z.string().describe("Name of the space"),
      description: z
        .string()
        .optional()
        .describe("Description of the space purpose"),
    }),
    handler: async ({ workspaceId, name, description }) => {
      return callMCPMethod("space.create", { workspaceId, name, description });
    },
  });
}

function registerSpaceListTool() {
  server.tool({
    name: "space.list",
    description: "Lists all available spaces",
    handler: async () => {
      return callMCPMethod("space.list", {});
    },
  });
}

// Page methods
function registerPageCreateTool() {
  server.tool({
    name: "page.create",
    description: "Creates a new document page within a space",
    inputSchema: z.object({
      workspaceId: z.string().describe("UUID of the workspace"),
      spaceId: z.string().describe("UUID of the space to create the page in"),
      title: z.string().describe("Title of the page"),
      content: z.any().describe("Page content in Docmost format"),
      parentId: z
        .string()
        .optional()
        .describe("UUID of the parent page, if creating a nested page"),
    }),
    handler: async ({ workspaceId, spaceId, title, content, parentId }) => {
      // Debug log the received content
      console.log("\n=== PAGE CREATE REQUEST RECEIVED ===");
      console.log("Title:", title);
      console.log("Content type:", typeof content);
      console.log("Content:", JSON.stringify(content, null, 2));

      // Ensure content is properly structured if it's a string
      if (typeof content === "string") {
        try {
          // Try to parse if it's a JSON string
          content = JSON.parse(content);
          console.log("Parsed string content to object");
        } catch (e) {
          // If not valid JSON, create minimal doc structure
          console.log(
            "Content was string but not JSON, creating basic structure"
          );
          content = {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: content,
                  },
                ],
              },
            ],
          };
        }
      }

      // Ensure content has the minimal required structure
      if (!content || typeof content !== "object") {
        console.log("Content was invalid, creating default structure");
        content = {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Empty document",
                },
              ],
            },
          ],
        };
      }

      // Log the final content being sent
      console.log("\n=== SENDING TO MCP SERVER ===");
      console.log("Final content:", JSON.stringify(content, null, 2));

      return callMCPMethod("page.create", {
        workspaceId,
        spaceId,
        title,
        content,
        parentId,
      });
    },
  });
}

/**
 * Helper function to call MCP method
 */
async function callMCPMethod(method, params) {
  return new Promise((resolve, reject) => {
    // Prepare request
    const mcpRequest = {
      jsonrpc: "2.0",
      method,
      params,
      id: Date.now(),
    };

    console.log(`\n=== CALLING MCP METHOD: ${method} ===`);

    // Log request details (but truncate large content fields)
    const logParams = { ...params };
    if (logParams.content && typeof logParams.content === "object") {
      logParams.content = {
        type: logParams.content.type,
        contentLength: JSON.stringify(logParams.content).length,
        summary: "Content truncated for logging...",
      };
    }
    console.log("Request parameters:", JSON.stringify(logParams, null, 2));

    // Configure request options
    const requestOptions = {
      hostname: "127.0.0.1",
      port: 3000,
      path: "/api/mcp",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    };

    console.log(
      `Sending request to: http://${requestOptions.hostname}:${requestOptions.port}${requestOptions.path}`
    );

    // Make request
    const req = http.request(requestOptions, (res) => {
      let data = "";

      console.log(`Response status: ${res.statusCode} ${res.statusMessage}`);

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          console.log(
            "Raw response data:",
            data.substring(0, 500) + (data.length > 500 ? "..." : "")
          );

          const response = JSON.parse(data);
          if (response.error) {
            console.error("MCP Error:", response.error);
            reject(new Error(response.error.message || "Unknown MCP error"));
          } else {
            console.log("MCP request successful");
            console.log("Result type:", typeof response.result);

            if (typeof response.result === "object") {
              console.log(
                "Result keys:",
                Object.keys(response.result).join(", ")
              );
            }

            resolve(response.result);
          }
        } catch (error) {
          console.error("Error parsing response:", error);
          console.error("Raw response:", data);
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      console.error("Request error:", error);
      reject(error);
    });

    // Log request size
    const requestBody = JSON.stringify(mcpRequest);
    console.log(`Request size: ${requestBody.length} bytes`);

    req.write(requestBody);
    req.end();
  });
}

// Register and start the server
registerTools();
server.start(3002);

console.log("Docmost Model Context Protocol Cursor SDK started");
console.log("Cursor should be configured to use http://localhost:3002");
console.log(
  "You can manually test by visiting http://localhost:3002/tools in your browser"
);
