import { z } from "zod";
import { SpaceResource } from "./space";
import { PageResource } from "./page";
import { WorkspaceResource } from "./workspace";
import { UserResource } from "./user";
import { CommentResource } from "./comment";
import { FileResource } from "./file";
import { GroupResource } from "./group";
import { PermissionResource } from "./permission";

export const resources = [
  WorkspaceResource,
  SpaceResource,
  PageResource,
  UserResource,
  CommentResource,
  FileResource,
  GroupResource,
  PermissionResource,
];

// Common schemas used across resources
export const commonSchemas = {
  id: z.string().describe("Unique identifier"),
  createdAt: z.string().describe("Creation timestamp"),
  updatedAt: z.string().describe("Last update timestamp"),
  workspaceId: z.string().describe("UUID of the workspace"),
  userId: z.string().describe("UUID of the user"),
};
