#!/usr/bin/env node
/**
 * Docmost Model Context Protocol (MCP) Bridge
 *
 * This script implements an MCP server that bridges Cursor with the Docmost API.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";

// Create a log file in the workspace root
const logFile = resolve(process.cwd(), "mcp-server.log");
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

// Read environment variables from root .env file
let envVars: Record<string, string> = {};
try {
  const envPath = resolve(process.cwd(), "../../.env");
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
    envVars = envContent.split("\n").reduce(
      (acc, line) => {
        const [key, value] = line.split("=");
        if (key && value) {
          acc[key.trim()] = value.trim();
        }
        return acc;
      },
      {} as Record<string, string>
    );
  } else {
    logToFile("Warning: .env file not found");
  }
} catch (error) {
  logToFile(
    `Error reading .env file: ${error instanceof Error ? error.message : "Unknown error"}`
  );
}

// Set environment variables
process.env.MCP_DEBUG = envVars.MCP_DEBUG || "true";
process.env.MCP_SERVER_URL = envVars.APP_URL || "http://localhost:3000";
process.env.MCP_API_KEY = envVars.APP_SECRET;
process.env.NODE_ENV = envVars.NODE_ENV || "development";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { resources } from "./resources.js";

// Debug mode - set to true to see detailed logs
const DEBUG = process.env.MCP_DEBUG === "true";

/**
 * Log debug messages if debug mode is enabled
 */
function debug(...args: any[]) {
  const message = args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
    .join(" ");
  if (DEBUG) {
    console.error("[DEBUG]", ...args);
    logToFile(`[DEBUG] ${message}`);
  }
}

interface ResourceOperation {
  description: string;
  handler: (params: any) => Promise<any>;
}

interface Resource {
  name: string;
  description: string;
  schema: any;
  operations: Record<string, ResourceOperation>;
}

function isResource(value: any): value is Resource {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "operations" in value &&
    "schema" in value
  );
}

// Create server instance
const server = new McpServer({
  name: "docmost",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Register all resources
async function main() {
  try {
    logToFile("=== Docmost MCP Bridge Starting ===");
    logToFile(`Current working directory: ${process.cwd()}`);
    logToFile(`Process ID: ${process.pid}`);
    logToFile(
      `Environment variables: ${JSON.stringify(
        {
          MCP_DEBUG: process.env.MCP_DEBUG,
          MCP_SERVER_URL: process.env.MCP_SERVER_URL,
          MCP_API_KEY: process.env.MCP_API_KEY ? "***" : "not set",
          NODE_ENV: process.env.NODE_ENV,
        },
        null,
        2
      )}`
    );

    // Register all resources
    resources.forEach((resource) => {
      if (isResource(resource)) {
        logToFile(`Registering resource: ${resource.name}`);
        Object.entries(resource.operations).forEach(([operation, config]) => {
          const toolName = `${resource.name}.${operation}`;
          logToFile(`  Registering tool: ${toolName}`);
          server.tool(
            toolName,
            config.description,
            resource.schema.shape,
            async (params: Record<string, unknown>) => {
              try {
                logToFile(
                  `Handling ${toolName} with params: ${JSON.stringify(params)}`
                );
                const result = await config.handler(params);
                logToFile(`Tool ${toolName} completed successfully`);
                return {
                  content: [
                    {
                      type: "text" as const,
                      text: JSON.stringify(result, null, 2),
                    },
                  ],
                };
              } catch (error: unknown) {
                logToFile(
                  `Error in ${toolName}: ${error instanceof Error ? error.message : "Unknown error"}`
                );
                return {
                  content: [
                    {
                      type: "text" as const,
                      text: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
                    },
                  ],
                };
              }
            }
          );
        });
      }
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    logToFile("Docmost MCP Bridge running on stdio");
  } catch (error) {
    logToFile(
      `Fatal error in main(): ${error instanceof Error ? error.message : "Unknown error"}`
    );
    process.exit(1);
  }
}

main().catch((error) => {
  logToFile(
    `Fatal error: ${error instanceof Error ? error.message : "Unknown error"}`
  );
  process.exit(1);
});
