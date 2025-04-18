import { z } from "zod";
import { commonSchemas } from "./index";
import { api } from "../api";

export const CommentResource = {
  name: "comment",
  description: "Comments on pages and documents",
  schema: z.object({
    content: z.string().describe("Comment content"),
    pageId: z.string().describe("UUID of the page being commented on"),
    parentId: z
      .string()
      .optional()
      .describe("UUID of the parent comment if this is a reply"),
    ...commonSchemas,
  }),
  operations: {
    create: {
      description: "Create a new comment",
      handler: async (params: {
        workspaceId: string;
        pageId: string;
        content: string;
        parentId?: string;
      }) => {
        const response = await api.post("/comments", params);
        return response.data;
      },
    },
    list: {
      description: "List comments on a page",
      handler: async (params: { workspaceId: string; pageId: string }) => {
        const response = await api.get("/comments", { params });
        return response.data;
      },
    },
    get: {
      description: "Get a comment by ID",
      handler: async (params: { id: string }) => {
        const response = await api.get(`/comments/${params.id}`);
        return response.data;
      },
    },
    update: {
      description: "Update a comment",
      handler: async (params: { id: string; content: string }) => {
        const { id, ...data } = params;
        const response = await api.put(`/comments/${id}`, data);
        return response.data;
      },
    },
    delete: {
      description: "Delete a comment",
      handler: async (params: { id: string }) => {
        await api.delete(`/comments/${params.id}`);
        return { success: true };
      },
    },
  },
};
