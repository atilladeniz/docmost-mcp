import { z } from "zod";
import axios from "axios";

// Helper function to make API requests
async function makeRequest(
  endpoint: string,
  method: string = "GET",
  data?: any
) {
  const url = `${process.env.MCP_SERVER_URL}/api${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.MCP_API_KEY}`,
  };

  try {
    const response = await axios({
      method,
      url,
      headers,
      data,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
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
  }),
  operations: {
    create: {
      description: "Create a new space",
      handler: async (params: any) => {
        return makeRequest("/spaces", "POST", params);
      },
    },
    list: {
      description: "List all spaces",
      handler: async () => {
        return makeRequest("/spaces");
      },
    },
    update: {
      description: "Update a space",
      handler: async (params: any) => {
        const { id, ...data } = params;
        return makeRequest(`/spaces/${id}`, "PUT", data);
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
        return makeRequest("/pages", "POST", params);
      },
    },
  },
};

// Export all resources
export const resources = [spaceResource, pageResource];
