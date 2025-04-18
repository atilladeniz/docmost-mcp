export enum MCPEventType {
  CREATED = "created",
  UPDATED = "updated",
  DELETED = "deleted",
  MOVED = "moved",
  PERMISSION_CHANGED = "permission_changed",
  PRESENCE = "presence",
}

export enum MCPResourceType {
  PAGE = "page",
  SPACE = "space",
  WORKSPACE = "workspace",
  USER = "user",
  GROUP = "group",
  ATTACHMENT = "attachment",
  COMMENT = "comment",
}

export enum MCPOperationType {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  MOVE = "move",
  ADD_MEMBER = "add_member",
  REMOVE_MEMBER = "remove_member",
}

export interface MCPEvent {
  type: MCPEventType;
  resource: MCPResourceType;
  operation: MCPOperationType;
  resourceId: string;
  timestamp: string;
  data?: any;
  userId: string;
  workspaceId: string;
  spaceId?: string;
}

export interface PageEventData {
  title?: string;
  parentPageId?: string;
  content?: any;
}

export interface CommentEventData {
  content?: any;
  pageId?: string;
  parentCommentId?: string;
}

export interface PresenceEventData {
  pageId: string;
  status: "online" | "offline" | "idle";
  lastActive: string;
  cursorPosition?: {
    x: number;
    y: number;
  };
}
