#!/usr/bin/env node
/**
 * Docmost Model Context Protocol (MCP) Bridge
 *
 * This script implements an MCP server that bridges Cursor with the Docmost API.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import { resources } from "./resources.js";
import { makeRequest } from "./api.js";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";

// Create a log file in the workspace root
const logFile = resolve(process.cwd(), "mcp-bridge.log");
function logToFile(message: string) {
  try {
    // Ensure the directory exists
    const logDir = dirname(logFile);
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
    writeFileSync(logFile, `${new Date().toISOString()} - ${message}\n`, {
      flag: "a",
    });
  } catch (error) {
    console.error("Failed to write to log file:", error);
  }
}

// Debug mode
const DEBUG = process.env.MCP_DEBUG === "true";

// Initialize MCP server
const server = new McpServer({
  name: "docmost",
  version: "1.0.0",
});

// Configure server with environment variables
const config = {
  serverUrl: process.env.MCP_SERVER_URL || "http://localhost:3000",
  apiKey: process.env.MCP_API_KEY,
  userId: process.env.MCP_USER_ID,
  workspaceId: process.env.MCP_WORKSPACE_ID,
  userEmail: process.env.MCP_USER_EMAIL,
};

logToFile(`Starting MCP Bridge with configuration:
  MCP_SERVER_URL: ${config.serverUrl}
  MCP_API_KEY: ${config.apiKey ? "***" : "not set"}
  MCP_USER_ID: ${config.userId || "not set"}
  MCP_WORKSPACE_ID: ${config.workspaceId || "not set"}
  MCP_USER_EMAIL: ${config.userEmail || "not set"}
`);

// Helper function to convert JSON Schema to Zod schema
function jsonSchemaToZod(schema: any): z.ZodRawShape {
  if (!schema.type || schema.type !== "object") {
    return {};
  }

  const shape: z.ZodRawShape = {};
  for (const [key, value] of Object.entries(schema.properties || {})) {
    const prop = value as any;
    switch (prop.type) {
      case "string":
        shape[key] = z.string();
        break;
      case "number":
      case "integer":
        shape[key] = z.number();
        break;
      case "boolean":
        shape[key] = z.boolean();
        break;
      case "object":
        shape[key] = z.object(jsonSchemaToZod(prop));
        break;
      case "array":
        shape[key] = z.array(
          prop.items ? z.object(jsonSchemaToZod(prop.items)) : z.any()
        );
        break;
      default:
        shape[key] = z.any();
    }
    if (!schema.required?.includes(key)) {
      shape[key] = shape[key].optional();
    }
  }
  return shape;
}

async function main() {
  try {
    logToFile("=== Docmost MCP Bridge Starting ===");

    // Register tools from resources
    for (const resource of Object.values(resources)) {
      logToFile(`Registering resource: ${resource.name}`);

      // Register operations for this resource
      for (const [opName, operation] of Object.entries(resource.operations)) {
        const toolName = `${resource.name}_${opName}`;
        logToFile(`Registering tool: ${toolName}`);

        // Extract schema from the makeRequest call in the handler
        const methodName = `${resource.name}.${opName}`;
        logToFile(`Method name: ${methodName}`);

        // Determine the appropriate schema based on the operation
        let zodSchema: any = {};

        // Handle special cases for different operations
        if (resource.name === "space") {
          if (opName === "list") {
            zodSchema = {
              workspaceId: z.string(),
              page: z.number().optional(),
              limit: z.number().optional(),
              name: z.string().optional(), // Special case for space.list
            };
          } else if (opName === "create") {
            zodSchema = {
              name: z.string(),
              description: z.string().optional(),
              slug: z.string().optional(),
              workspaceId: z.string(),
            };
          } else if (opName === "update") {
            zodSchema = {
              spaceId: z.string(),
              workspaceId: z.string(),
              name: z.string().optional(),
              description: z.string().optional(),
              slug: z.string().optional(),
            };
          } else if (opName === "delete") {
            zodSchema = {
              spaceId: z.string(),
              workspaceId: z.string(),
            };
          }
        } else if (resource.name === "page") {
          if (opName === "list") {
            zodSchema = {
              spaceId: z.string(),
              workspaceId: z.string(),
              page: z.number().optional(),
              limit: z.number().optional(),
            };
          } else if (opName === "create") {
            zodSchema = {
              title: z.string(),
              content: z.object({
                type: z.string(),
                content: z.array(z.any()),
              }),
              spaceId: z.string(),
              workspaceId: z.string(),
              parentId: z.string().optional(),
            };
          } else if (opName === "update") {
            zodSchema = {
              pageId: z.string(),
              workspaceId: z.string(),
              title: z.string().optional(),
              content: z
                .object({
                  type: z.string(),
                  content: z.array(z.any()),
                })
                .optional(),
              parentId: z.string().optional(),
            };
          } else if (opName === "delete") {
            zodSchema = {
              pageId: z.string(),
              workspaceId: z.string(),
            };
          } else if (opName === "move") {
            zodSchema = {
              pageId: z.string(),
              workspaceId: z.string(),
              parentId: z.union([z.string(), z.null()]).optional(),
              spaceId: z.string().optional(),
            };
          }
        }

        server.tool(
          toolName,
          operation.description,
          zodSchema,
          async (params: Record<string, any>) => {
            logToFile(
              `Handling ${toolName} with params: ${JSON.stringify(params)}`
            );
            try {
              // Special handling for page.move operation with null parentId
              if (
                resource.name === "page" &&
                opName === "move" &&
                params.parentId === null
              ) {
                logToFile(`Handling null parentId in page.move operation`);

                // Some APIs might expect null, others might expect the field to be omitted
                // Try both approaches with a slight preference for explicit null
                const result = await makeRequest(
                  `${resource.name}.${opName}`,
                  params
                );

                logToFile(`Tool ${toolName} completed successfully`);

                // Format the response according to MCP protocol expectations
                return {
                  content: [
                    {
                      type: "text" as const,
                      text: JSON.stringify(result, null, 2),
                    },
                  ],
                };
              }

              // Special handling for page.move operation to map spaceId to targetSpaceId
              if (
                resource.name === "page" &&
                opName === "move" &&
                params.spaceId
              ) {
                logToFile(
                  `Mapping spaceId to targetSpaceId in page.move operation`
                );
                const { spaceId, ...restParams } = params;
                params = { ...restParams, targetSpaceId: spaceId };
              }

              // Remove name parameter for space.list if it's present but not used
              if (
                resource.name === "space" &&
                opName === "list" &&
                params.name
              ) {
                const { name, ...restParams } = params;
                params = restParams;
              }

              const result = await makeRequest(
                `${resource.name}.${opName}`,
                params
              );
              logToFile(`Tool ${toolName} completed successfully`);

              // Format the response according to MCP protocol expectations
              return {
                content: [
                  {
                    type: "text" as const,
                    text: JSON.stringify(result, null, 2),
                  },
                ],
              };
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
              logToFile(`Error in ${toolName}: ${errorMessage}`);

              // Format error response in the expected format
              return {
                content: [
                  {
                    type: "text" as const,
                    text: `Error: ${errorMessage}`,
                  },
                ],
                isError: true,
              };
            }
          }
        );
      }
    }

    // Connect to MCP
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logToFile("MCP Bridge running successfully");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logToFile(`Fatal error: ${errorMessage}`);
    console.error(`Fatal error: ${errorMessage}`);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
