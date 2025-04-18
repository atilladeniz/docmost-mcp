import { z } from "zod";
import { commonSchemas } from "./index";
import { api } from "../api";

export const WorkspaceResource = {
  name: "workspace",
  description: "Docmost workspaces for organizing content",
  schema: z.object({
    name: z.string().describe("Name of the workspace"),
    description: z.string().optional().describe("Description of the workspace"),
    ...commonSchemas,
  }),
  operations: {
    create: {
      description: "Create a new workspace",
      handler: async (params) => {
        const response = await api.post("/workspaces", params);
        return response.data;
      },
    },
    list: {
      description: "List all workspaces",
      handler: async () => {
        const response = await api.get("/workspaces");
        return response.data;
      },
    },
    get: {
      description: "Get a workspace by ID",
      handler: async (params) => {
        const { id } = params;
        const response = await api.get(`/workspaces/${id}`);
        return response.data;
      },
    },
    update: {
      description: "Update a workspace",
      handler: async (params) => {
        const { id, ...data } = params;
        const response = await api.put(`/workspaces/${id}`, data);
        return response.data;
      },
    },
    delete: {
      description: "Delete a workspace",
      handler: async (params) => {
        const { id } = params;
        await api.delete(`/workspaces/${id}`);
        return { success: true };
      },
    },
  },
};
