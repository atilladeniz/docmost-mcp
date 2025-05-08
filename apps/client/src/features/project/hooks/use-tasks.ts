import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "../services/project-service";
import {
  CreateTaskParams,
  Task,
  TaskListParams,
  TaskListBySpaceParams,
  UpdateTaskParams,
} from "../types";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";

const TASKS_QUERY_KEY = "tasks";
const PROJECT_TASKS_QUERY_KEY = "project-tasks";
const SPACE_TASKS_QUERY_KEY = "space-tasks";

export function useTasksByProject(params: TaskListParams) {
  return useQuery({
    queryKey: [PROJECT_TASKS_QUERY_KEY, params],
    queryFn: () => projectService.listTasksByProject(params),
    enabled: !!params.projectId,
  });
}

export function useTasksBySpace(params: TaskListBySpaceParams) {
  return useQuery({
    queryKey: [SPACE_TASKS_QUERY_KEY, params],
    queryFn: () => projectService.listTasksBySpace(params),
    enabled: !!params.spaceId,
  });
}

export function useTask(taskId: string | undefined) {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, taskId],
    queryFn: () => projectService.getTaskById(taskId as string),
    enabled: !!taskId,
  });
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (params: CreateTaskParams) => projectService.createTask(params),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries based on task properties
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: [
            PROJECT_TASKS_QUERY_KEY,
            { projectId: variables.projectId },
          ],
        });
      }
      if (variables.spaceId) {
        queryClient.invalidateQueries({
          queryKey: [SPACE_TASKS_QUERY_KEY, { spaceId: variables.spaceId }],
        });
      }

      notifications.show({
        title: t("Task created"),
        message: t('Task "{title}" has been created successfully', {
          title: variables.title,
        }),
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: t("Error"),
        message: t("Failed to create task"),
        color: "red",
      });
    },
  });
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (params: UpdateTaskParams) => projectService.updateTask(params),
    onSuccess: (data, variables) => {
      // Invalidate specific task
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, data.id] });

      // Invalidate project and space task lists
      if (data.projectId) {
        queryClient.invalidateQueries({
          queryKey: [PROJECT_TASKS_QUERY_KEY, { projectId: data.projectId }],
        });
      }
      if (data.spaceId) {
        queryClient.invalidateQueries({
          queryKey: [SPACE_TASKS_QUERY_KEY, { spaceId: data.spaceId }],
        });
      }

      const taskTitle = data.title || variables.title || "";

      notifications.show({
        title: t("Task updated"),
        message: taskTitle
          ? t('Task "{title}" has been updated successfully', {
              title: taskTitle,
            })
          : t("Task has been updated successfully"),
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: t("Error"),
        message: t("Failed to update task"),
        color: "red",
      });
    },
  });
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      taskId,
      taskTitle,
    }: {
      taskId: string;
      taskTitle?: string;
    }) => projectService.deleteTask(taskId),
    onSuccess: (data, variables) => {
      // Since we don't know the task's project or space ID at this point,
      // invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: [PROJECT_TASKS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SPACE_TASKS_QUERY_KEY] });

      const title = variables.taskTitle || "";

      notifications.show({
        title: t("Task deleted"),
        message: title
          ? t('Task "{title}" has been deleted successfully', { title })
          : t("Task has been deleted successfully"),
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: t("Error"),
        message: t("Failed to delete task"),
        color: "red",
      });
    },
  });
}

export function useCompleteTaskMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      taskId,
      isCompleted,
    }: {
      taskId: string;
      isCompleted: boolean;
    }) => projectService.completeTask(taskId, isCompleted),
    onSuccess: (data) => {
      // Invalidate specific task
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, data.id] });

      // Invalidate project and space task lists
      if (data.projectId) {
        queryClient.invalidateQueries({
          queryKey: [PROJECT_TASKS_QUERY_KEY, { projectId: data.projectId }],
        });
      }
      if (data.spaceId) {
        queryClient.invalidateQueries({
          queryKey: [SPACE_TASKS_QUERY_KEY, { spaceId: data.spaceId }],
        });
      }

      notifications.show({
        title: data.isCompleted ? t("Task completed") : t("Task reopened"),
        message: data.isCompleted
          ? t("Task has been marked as completed")
          : t("Task has been reopened"),
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: t("Error"),
        message: t("Failed to update task"),
        color: "red",
      });
    },
  });
}

export function useAssignTaskMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      taskId,
      assigneeId,
    }: {
      taskId: string;
      assigneeId?: string;
    }) => projectService.assignTask(taskId, assigneeId),
    onSuccess: (data) => {
      // Invalidate specific task
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, data.id] });

      // Invalidate project and space task lists
      if (data.projectId) {
        queryClient.invalidateQueries({
          queryKey: [PROJECT_TASKS_QUERY_KEY, { projectId: data.projectId }],
        });
      }
      if (data.spaceId) {
        queryClient.invalidateQueries({
          queryKey: [SPACE_TASKS_QUERY_KEY, { spaceId: data.spaceId }],
        });
      }

      notifications.show({
        title: t("Task assigned"),
        message: data.assigneeId
          ? t("Task has been assigned successfully")
          : t("Task has been unassigned"),
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: t("Error"),
        message: t("Failed to assign task"),
        color: "red",
      });
    },
  });
}

export function useUpdateTaskPositionMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (params: {
      taskId: string;
      position: string;
      projectId?: string;
      spaceId?: string;
    }) => {
      console.log("🔄 Updating task position:", params);

      // Call the updateTask endpoint with position parameter
      const result = await projectService.updateTask({
        taskId: params.taskId,
        position: params.position,
      });

      console.log("✅ Position update result:", result);
      return result;
    },

    // Silent update - no notifications
    onSuccess: (data, variables) => {
      console.log("🎉 Position update success:", data);

      // More aggressive cache invalidation to ensure UI updates
      // Invalidate the specific task
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, data.id] });

      // Invalidate project and space task lists
      if (data.projectId) {
        // Invalidate at multiple levels to ensure all task lists update
        queryClient.invalidateQueries({
          queryKey: [PROJECT_TASKS_QUERY_KEY],
        });
        queryClient.invalidateQueries({
          queryKey: [PROJECT_TASKS_QUERY_KEY, data.projectId],
        });
        queryClient.invalidateQueries({
          queryKey: [PROJECT_TASKS_QUERY_KEY, { projectId: data.projectId }],
        });
      }

      if (data.spaceId) {
        // Invalidate at multiple levels to ensure all task lists update
        queryClient.invalidateQueries({
          queryKey: [SPACE_TASKS_QUERY_KEY],
        });
        queryClient.invalidateQueries({
          queryKey: [SPACE_TASKS_QUERY_KEY, data.spaceId],
        });
        queryClient.invalidateQueries({
          queryKey: [SPACE_TASKS_QUERY_KEY, { spaceId: data.spaceId }],
        });
      }

      // Also invalidate the general tasks queries
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });

      // Force refetch to ensure fresh data
      if (data.projectId) {
        queryClient.refetchQueries({
          queryKey: [PROJECT_TASKS_QUERY_KEY, { projectId: data.projectId }],
        });
      }
    },
    onError: (error) => {
      console.error("❌ Error updating task position:", error);

      // Add user notification for position update failures
      notifications.show({
        title: t("Error updating task order"),
        message: t("Please try again or refresh the page"),
        color: "red",
      });
    },
  });
}
