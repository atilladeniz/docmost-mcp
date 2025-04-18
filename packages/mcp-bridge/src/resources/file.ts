import { z } from "zod";
import { commonSchemas } from "./index";
import { api } from "../api";

export const FileResource = {
  name: "file",
  description: "Files and attachments in Docmost",
  schema: z.object({
    name: z.string().describe("Name of the file"),
    type: z.string().describe("MIME type of the file"),
    size: z.number().describe("Size of the file in bytes"),
    path: z.string().describe("Path where the file is stored"),
    ...commonSchemas,
  }),
  operations: {
    upload: {
      description: "Upload a new file",
      handler: async (params: {
        workspaceId: string;
        file: Buffer;
        name: string;
        type: string;
      }) => {
        const formData = new FormData();
        formData.append("file", new Blob([params.file]), params.name);
        formData.append("name", params.name);
        formData.append("type", params.type);

        const response = await api.post("/files", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response.data;
      },
    },
    list: {
      description: "List files in a workspace",
      handler: async (params: { workspaceId: string }) => {
        const response = await api.get("/files", { params });
        return response.data;
      },
    },
    get: {
      description: "Get a file by ID",
      handler: async (params: { id: string }) => {
        const response = await api.get(`/files/${params.id}`);
        return response.data;
      },
    },
    delete: {
      description: "Delete a file",
      handler: async (params: { id: string }) => {
        await api.delete(`/files/${params.id}`);
        return { success: true };
      },
    },
  },
};
