import { z } from "zod";
import { commonSchemas } from "./index";
import { api } from "../api";

export const GroupResource = {
  name: "group",
  description: "User groups for managing permissions",
  schema: z.object({
    name: z.string().describe("Name of the group"),
    description: z.string().optional().describe("Description of the group"),
    ...commonSchemas,
  }),
  operations: {
    create: {
      description: "Create a new group",
      handler: async (params: {
        workspaceId: string;
        name: string;
        description?: string;
      }) => {
        const response = await api.post("/groups", params);
        return response.data;
      },
    },
    list: {
      description: "List groups in a workspace",
      handler: async (params: { workspaceId: string }) => {
        const response = await api.get("/groups", { params });
        return response.data;
      },
    },
    get: {
      description: "Get a group by ID",
      handler: async (params: { id: string }) => {
        const response = await api.get(`/groups/${params.id}`);
        return response.data;
      },
    },
    update: {
      description: "Update a group",
      handler: async (params: {
        id: string;
        name?: string;
        description?: string;
      }) => {
        const { id, ...data } = params;
        const response = await api.put(`/groups/${id}`, data);
        return response.data;
      },
    },
    delete: {
      description: "Delete a group",
      handler: async (params: { id: string }) => {
        await api.delete(`/groups/${params.id}`);
        return { success: true };
      },
    },
    addUser: {
      description: "Add a user to a group",
      handler: async (params: { groupId: string; userId: string }) => {
        const response = await api.post(`/groups/${params.groupId}/users`, {
          userId: params.userId,
        });
        return response.data;
      },
    },
    removeUser: {
      description: "Remove a user from a group",
      handler: async (params: { groupId: string; userId: string }) => {
        await api.delete(`/groups/${params.groupId}/users/${params.userId}`);
        return { success: true };
      },
    },
  },
};
