import { z } from "zod";
import { commonSchemas } from "./index";
import { api } from "../api";

export const UserResource = {
  name: "user",
  description: "Docmost users and their permissions",
  schema: z.object({
    email: z.string().email().describe("User's email address"),
    name: z.string().describe("User's full name"),
    role: z
      .enum(["admin", "member", "viewer"])
      .describe("User's role in the workspace"),
    ...commonSchemas,
  }),
  operations: {
    create: {
      description: "Create a new user",
      handler: async (params: {
        workspaceId: string;
        email: string;
        name: string;
        role: "admin" | "member" | "viewer";
      }) => {
        const response = await api.post("/users", params);
        return response.data;
      },
    },
    list: {
      description: "List users in a workspace",
      handler: async (params: { workspaceId: string }) => {
        const response = await api.get("/users", { params });
        return response.data;
      },
    },
    get: {
      description: "Get a user by ID",
      handler: async (params: { id: string }) => {
        const response = await api.get(`/users/${params.id}`);
        return response.data;
      },
    },
    update: {
      description: "Update a user",
      handler: async (params: {
        id: string;
        name?: string;
        role?: "admin" | "member" | "viewer";
      }) => {
        const { id, ...data } = params;
        const response = await api.put(`/users/${id}`, data);
        return response.data;
      },
    },
    delete: {
      description: "Delete a user",
      handler: async (params: { id: string }) => {
        await api.delete(`/users/${params.id}`);
        return { success: true };
      },
    },
  },
};
