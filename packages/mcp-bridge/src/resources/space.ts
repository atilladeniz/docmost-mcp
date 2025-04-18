import { z } from "zod";
import { commonSchemas } from "./index";
import { api } from "../api";

export const SpaceResource = {
  name: "space",
  description: "Workspace spaces for organizing documents",
  schema: z.object({
    name: z.string().describe("Name of the space"),
    description: z
      .string()
      .optional()
      .describe("Description of the space purpose"),
    ...commonSchemas,
  }),
  operations: {
    create: {
      description: "Create a new space",
      handler: async (params: {
        workspaceId: string;
        name: string;
        description?: string;
      }) => {
        const response = await api.post("/spaces", params);
        return response.data;
      },
    },
    list: {
      description: "List spaces in a workspace",
      handler: async (params: { workspaceId: string }) => {
        const response = await api.get("/spaces", { params });
        return response.data;
      },
    },
    get: {
      description: "Get a space by ID",
      handler: async (params: { id: string }) => {
        const response = await api.get(`/spaces/${params.id}`);
        return response.data;
      },
    },
    update: {
      description: "Update a space",
      handler: async (params: {
        id: string;
        name?: string;
        description?: string;
      }) => {
        const { id, ...data } = params;
        const response = await api.put(`/spaces/${id}`, data);
        return response.data;
      },
    },
    delete: {
      description: "Delete a space",
      handler: async (params: { id: string }) => {
        await api.delete(`/spaces/${params.id}`);
        return { success: true };
      },
    },
  },
};
