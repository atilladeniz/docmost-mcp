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
        title: t("Task updated"),
        message: t("Task has been updated successfully"),
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
    mutationFn: (taskId: string) => projectService.deleteTask(taskId),
    onSuccess: (data, variables, context) => {
      // Since we don't know the task's project or space ID at this point,
      // invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: [PROJECT_TASKS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SPACE_TASKS_QUERY_KEY] });

      notifications.show({
        title: t("Task deleted"),
        message: t("Task has been deleted successfully"),
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
