import { z } from "zod";
import { api } from "./api.js";
import axios from "axios";

// Helper function to make API requests
async function makeRequest(
  method: string,
  httpMethod: string = "GET",
  data?: any
) {
  console.error(`[DEBUG] Making ${httpMethod} request with method ${method}`);
  console.error(`[DEBUG] Data: ${JSON.stringify(data, null, 2)}`);
  console.error(
    `[DEBUG] Headers: ${JSON.stringify(api.defaults.headers, null, 2)}`
  );

  try {
    // Format as JSON-RPC 2.0 request
    const jsonRpcRequest = {
      jsonrpc: "2.0",
      method,
      params: data,
      id: Date.now(),
    };

    console.error(
      `[DEBUG] JSON-RPC Request: ${JSON.stringify(jsonRpcRequest, null, 2)}`
    );

    const response = await api({
      method: "POST",
      url: "/api/mcp",
      data: jsonRpcRequest,
    });
    console.error(
      `[DEBUG] Response: ${JSON.stringify(response.data, null, 2)}`
    );
    return response.data.result;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[DEBUG] API Error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      });
      throw new Error(
        `API request failed: ${error.response?.data?.message || error.message}`
      );
    }
    throw error;
  }
}

// Space resource
const spaceResource = {
  name: "space",
  description: "Manage spaces in Docmost",
  schema: z.object({
    name: z.string().describe("Name of the space"),
    description: z.string().optional().describe("Description of the space"),
    slug: z.string().optional().describe("URL-friendly slug for the space"),
    workspaceId: z
      .string()
      .describe("ID of the workspace this space belongs to"),
  }),
  operations: {
    create: {
      description: "Create a new space",
      handler: async (params: any) => {
        return makeRequest("space.create", "POST", params);
      },
    },
    list: {
      description: "List all spaces",
      handler: async () => {
        return makeRequest("space.list");
      },
    },
    update: {
      description: "Update a space",
      handler: async (params: any) => {
        const { id, ...data } = params;
        return makeRequest("space.update", "POST", { id, ...data });
      },
    },
  },
};

// Page resource
const pageResource = {
  name: "page",
  description: "Manage pages in Docmost",
  schema: z.object({
    title: z.string().describe("Title of the page"),
    content: z.string().describe("Content of the page in markdown format"),
    spaceId: z.string().describe("ID of the space this page belongs to"),
    parentId: z.string().optional().describe("ID of the parent page, if any"),
  }),
  operations: {
    create: {
      description: "Create a new page",
      handler: async (params: any) => {
        return makeRequest("page.create", "POST", params);
      },
    },
  },
};

// Export all resources
export const resources = [spaceResource, pageResource];
