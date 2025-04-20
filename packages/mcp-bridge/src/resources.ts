import { z } from "zod";
import { api } from "./api.js";
import axios from "axios";

// Define common schemas
const contentSchema = z
  .object({
    type: z.string(),
    content: z.array(z.any()),
  })
  .describe("Content in Docmost format");

// Helper function to make API requests with type validation
async function makeRequest<T extends z.ZodSchema>(
  method: string,
  schema: T,
  data?: z.infer<T>,
  httpMethod: string = "POST"
) {
  console.error(`[DEBUG] Making ${httpMethod} request with method ${method}`);
  console.error(`[DEBUG] Data: ${JSON.stringify(data, null, 2)}`);
  console.error(
    `[DEBUG] Headers: ${JSON.stringify(api.defaults.headers, null, 2)}`
  );

  try {
    // Validate data against schema if provided
    if (schema && data) {
      try {
        schema.parse(data);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          console.error("[DEBUG] Validation Error:", validationError.errors);
          throw new Error(`Validation failed: ${validationError.message}`);
        }
        throw validationError;
      }
    }

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
      method: "POST", // Always POST for JSON-RPC
      url: "/api/mcp",
      data: jsonRpcRequest,
    });

    // Handle JSON-RPC error responses
    if (response.data.error) {
      console.error("[DEBUG] JSON-RPC Error:", response.data.error);
      const errorMessage = response.data.error.message || "Unknown error";
      const errorCode = response.data.error.code;
      const errorData = response.data.error.data;

      throw new Error(
        `JSON-RPC error ${errorCode}: ${errorMessage}${
          errorData ? ` - ${JSON.stringify(errorData)}` : ""
        }`
      );
    }

    console.error(
      `[DEBUG] Response: ${JSON.stringify(response.data, null, 2)}`
    );
    return response.data.result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[DEBUG] Validation Error:", error.errors);
      throw new Error(`Validation failed: ${error.message}`);
    }
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
    // Re-throw any other errors
    throw error;
  }
}

// Space resource schemas
const createSpaceSchema = z.object({
  name: z.string().describe("Name of the space"),
  description: z.string().optional().describe("Description of the space"),
  slug: z.string().optional().describe("URL-friendly slug for the space"),
  workspaceId: z.string().describe("ID of the workspace this space belongs to"),
});

const updateSpaceSchema = z.object({
  spaceId: z.string().describe("ID of the space to update"),
  workspaceId: z.string().describe("ID of the workspace this space belongs to"),
  name: z.string().optional().describe("New name for the space"),
  description: z.string().optional().describe("Description of the space"),
  slug: z.string().optional().describe("URL-friendly slug for the space"),
});

// Space resource
const spaceResource = {
  name: "space",
  description: "Manage spaces in Docmost",
  schema: createSpaceSchema,
  operations: {
    create: {
      description: "Create a new space",
      handler: async (params: z.infer<typeof createSpaceSchema>) => {
        return makeRequest("space.create", createSpaceSchema, params);
      },
    },
    list: {
      description: "List all spaces",
      handler: async (params?: {
        workspaceId: string;
        page?: number;
        limit?: number;
      }) => {
        return makeRequest(
          "space.list",
          z.object({
            workspaceId: z.string().describe("ID of the workspace"),
            page: z
              .number()
              .int()
              .optional()
              .describe("Page number for pagination"),
            limit: z
              .number()
              .int()
              .optional()
              .describe("Number of items per page"),
          }),
          params
        );
      },
    },
    update: {
      description: "Update a space",
      handler: async (params: z.infer<typeof updateSpaceSchema>) => {
        return makeRequest("space.update", updateSpaceSchema, params);
      },
    },
    delete: {
      description: "Delete a space",
      handler: async (params: { spaceId: string; workspaceId: string }) => {
        return makeRequest(
          "space.delete",
          z.object({
            spaceId: z.string().describe("ID of the space to delete"),
            workspaceId: z.string().describe("ID of the workspace"),
          }),
          params
        );
      },
    },
  },
};

// Page resource schemas
const createPageSchema = z.object({
  title: z.string().describe("Title of the page"),
  content: contentSchema,
  spaceId: z.string().describe("ID of the space this page belongs to"),
  workspaceId: z.string().describe("ID of the workspace this page belongs to"),
  parentId: z.string().optional().describe("ID of the parent page, if any"),
});

const updatePageSchema = z.object({
  pageId: z.string().describe("ID of the page to update"),
  workspaceId: z.string().describe("ID of the workspace this page belongs to"),
  title: z.string().optional().describe("New title for the page"),
  content: contentSchema.optional().describe("New content for the page"),
  parentId: z.string().optional().describe("ID of the parent page"),
});

const movePageSchema = z.object({
  pageId: z.string().describe("ID of the page to move"),
  workspaceId: z.string().describe("ID of the workspace this page belongs to"),
  parentId: z.string().optional().describe("ID of the new parent page"),
  spaceId: z.string().optional().describe("ID of the new space"),
});

// Page resource
const pageResource = {
  name: "page",
  description: "Manage pages in Docmost",
  schema: createPageSchema,
  operations: {
    create: {
      description: "Create a new page",
      handler: async (params: z.infer<typeof createPageSchema>) => {
        return makeRequest("page.create", createPageSchema, params);
      },
    },
    list: {
      description: "List pages in a space",
      handler: async (params: { spaceId: string; workspaceId: string }) => {
        return makeRequest(
          "page.list",
          z.object({
            spaceId: z.string().describe("ID of the space"),
            workspaceId: z.string().describe("ID of the workspace"),
          }),
          params
        );
      },
    },
    update: {
      description: "Update a page",
      handler: async (params: z.infer<typeof updatePageSchema>) => {
        return makeRequest("page.update", updatePageSchema, params);
      },
    },
    delete: {
      description: "Delete a page",
      handler: async (params: { pageId: string; workspaceId: string }) => {
        return makeRequest(
          "page.delete",
          z.object({
            pageId: z.string().describe("ID of the page to delete"),
            workspaceId: z.string().describe("ID of the workspace"),
          }),
          params
        );
      },
    },
    move: {
      description: "Move a page to a different parent or space",
      handler: async (params: z.infer<typeof movePageSchema>) => {
        return makeRequest("page.move", movePageSchema, params);
      },
    },
  },
};

// Export all resources
export const resources = [spaceResource, pageResource];
