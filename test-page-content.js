#!/usr/bin/env node
/**
 * Test script for page content handling in MCP Cursor SDK
 *
 * This script simulates the page create request that might come from Cursor
 * and helps diagnose content formatting issues.
 */

const http = require("http");
const fs = require("fs");

// Get test parameters from .env.mcp file if available
let workspaceId = "";
let userId = "";

try {
  const envContent = fs.readFileSync(".env.mcp", "utf8");
  const workspaceMatch = envContent.match(/MCP_WORKSPACE_ID=([^\r\n]+)/);
  const userMatch = envContent.match(/MCP_USER_ID=([^\r\n]+)/);

  if (workspaceMatch && workspaceMatch[1]) {
    workspaceId = workspaceMatch[1].trim();
  }

  if (userMatch && userMatch[1]) {
    userId = userMatch[1].trim();
  }
} catch (err) {
  console.error("Could not read .env.mcp file:", err.message);
}

// Hard-coded fallbacks in case .env.mcp isn't available
workspaceId = workspaceId || "01963588-32a9-7f89-879e-afb8fb600a5a";
userId = userId || "01963588-32a6-7968-99c6-748710c1cb61";

// Get space ID - we'll use the first available space from the workspace
async function getFirstSpaceId() {
  try {
    const apiKey = fs.readFileSync(".mcp-api-key", "utf8").trim();

    const options = {
      hostname: "127.0.0.1",
      port: 3000,
      path: "/api/mcp",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    };

    const mcpRequest = {
      jsonrpc: "2.0",
      method: "space.list",
      params: {
        workspaceId,
        page: 1,
        limit: 10,
      },
      id: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const response = JSON.parse(data);
            if (response.error) {
              reject(new Error(response.error.message));
              return;
            }

            if (
              response.result &&
              response.result.items &&
              response.result.items.length > 0
            ) {
              resolve(response.result.items[0].id);
            } else {
              reject(new Error("No spaces found in workspace"));
            }
          } catch (err) {
            reject(err);
          }
        });
      });

      req.on("error", reject);
      req.write(JSON.stringify(mcpRequest));
      req.end();
    });
  } catch (err) {
    console.error("Failed to get space ID:", err.message);
    throw err;
  }
}

// Test the MCP Cursor SDK page create endpoint
async function testPageCreate() {
  try {
    // Get the first space ID
    const spaceId = await getFirstSpaceId();
    console.log(`Using space ID: ${spaceId}`);

    // Create a test page content object - this is what we want to see in the page
    const pageContent = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Test Page From Cursor SDK" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "This is a test page created through the MCP Cursor SDK.",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              marks: [{ type: "bold" }],
              text: "Important: ",
            },
            {
              type: "text",
              text: "The content should be correctly formatted and visible.",
            },
          ],
        },
      ],
    };

    // Create the page create request - simulating what Cursor would send
    const cursorRequest = {
      name: "page.create",
      arguments: {
        workspaceId,
        spaceId,
        title: `Test Page ${new Date().toISOString()}`,
        content: pageContent,
      },
    };

    console.log("Sending request to MCP Cursor SDK...");

    // Send request to the MCP Cursor SDK
    const options = {
      hostname: "127.0.0.1",
      port: 3002, // MCP Cursor SDK port
      path: "/execute",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            console.log(`Response status: ${res.statusCode}`);
            console.log("Response data:", data);

            const response = JSON.parse(data);
            resolve(response);
          } catch (err) {
            reject(err);
          }
        });
      });

      req.on("error", reject);
      req.write(JSON.stringify(cursorRequest));
      req.end();
    });
  } catch (err) {
    console.error("Test failed:", err.message);
  }
}

// Run the test
console.log("=== TESTING PAGE CONTENT WITH MCP CURSOR SDK ===");
testPageCreate()
  .then((response) => {
    console.log("\n=== TEST COMPLETED ===");
    if (response.result && response.result.id) {
      console.log(`Page created successfully with ID: ${response.result.id}`);
      console.log("Check the page in the UI to see if content is visible");
    } else {
      console.log(
        "Test completed but page may not have been created correctly"
      );
    }
  })
  .catch((err) => {
    console.error("Test failed with error:", err.message);
  });
