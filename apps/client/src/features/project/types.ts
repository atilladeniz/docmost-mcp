export type TaskStatus =
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "blocked";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date | null;
  isCompleted: boolean;
  pageId?: string;
  assigneeId?: string | null;
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  } | null;
  icon?: string | null;
  coverImage?: string | null;
  projectId?: string;
  spaceId?: string;
}

export interface CreateTaskParams {
  title: string;
  description?: string;
  projectId?: string;
  spaceId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  assigneeId?: string | null;
}

export interface UpdateTaskParams {
  taskId: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  icon?: string | null;
  coverImage?: string | null;
}

export interface TaskListParams {
  projectId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
}

export interface TaskListBySpaceParams {
  spaceId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
}
