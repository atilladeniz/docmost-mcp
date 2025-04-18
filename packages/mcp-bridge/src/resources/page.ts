import { z } from "zod";
import { commonSchemas } from "./index";
import { api } from "../api";

export const PageResource = {
  name: "page",
  description: "Document pages within spaces",
  schema: z.object({
    title: z.string().describe("Title of the page"),
    content: z.any().describe("Page content"),
    parentId: z.string().optional().describe("UUID of the parent page"),
    ...commonSchemas,
  }),
  operations: {
    create: {
      description: "Create a new page",
      handler: async (params: {
        workspaceId: string;
        spaceId: string;
        title: string;
        content: any;
        parentId?: string;
      }) => {
        const response = await api.post("/pages", params);
        return response.data;
      },
    },
    list: {
      description: "List pages in a space",
      handler: async (params: { workspaceId: string; spaceId: string }) => {
        const response = await api.get("/pages", { params });
        return response.data;
      },
    },
    get: {
      description: "Get a page by ID",
      handler: async (params: { id: string }) => {
        const response = await api.get(`/pages/${params.id}`);
        return response.data;
      },
    },
    update: {
      description: "Update a page",
      handler: async (params: {
        id: string;
        title?: string;
        content?: any;
        parentId?: string;
      }) => {
        const { id, ...data } = params;
        const response = await api.put(`/pages/${id}`, data);
        return response.data;
      },
    },
    delete: {
      description: "Delete a page",
      handler: async (params: { id: string }) => {
        await api.delete(`/pages/${params.id}`);
        return { success: true };
      },
    },
  },
};
