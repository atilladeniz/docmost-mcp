import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "../services/project-service";
import {
  CreateProjectParams,
  Project,
  ProjectListParams,
  UpdateProjectParams,
} from "../types";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";

const PROJECTS_QUERY_KEY = "projects";

export function useProjects(params: ProjectListParams) {
  return useQuery({
    queryKey: [PROJECTS_QUERY_KEY, params],
    queryFn: () => projectService.listProjects(params),
  });
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: [PROJECTS_QUERY_KEY, projectId],
    queryFn: () => projectService.getProjectById(projectId as string),
    enabled: !!projectId,
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (params: CreateProjectParams) =>
      projectService.createProject(params),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
      notifications.show({
        title: t("Project created"),
        message: t('Project "{name}" has been created successfully', {
          name: variables.name,
        }),
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: t("Error"),
        message: t("Failed to create project"),
        color: "red",
      });
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (params: UpdateProjectParams) =>
      projectService.updateProject(params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [PROJECTS_QUERY_KEY, data.id],
      });
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
      notifications.show({
        title: t("Project updated"),
        message: t("Project has been updated successfully"),
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: t("Error"),
        message: t("Failed to update project"),
        color: "red",
      });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (projectId: string) => projectService.deleteProject(projectId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
      notifications.show({
        title: t("Project deleted"),
        message: t("Project has been deleted successfully"),
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: t("Error"),
        message: t("Failed to delete project"),
        color: "red",
      });
    },
  });
}

export function useArchiveProjectMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      projectId,
      isArchived,
    }: {
      projectId: string;
      isArchived: boolean;
    }) => projectService.archiveProject(projectId, isArchived),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [PROJECTS_QUERY_KEY, variables.projectId],
      });
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
      notifications.show({
        title: variables.isArchived
          ? t("Project archived")
          : t("Project unarchived"),
        message: variables.isArchived
          ? t("Project has been archived successfully")
          : t("Project has been unarchived successfully"),
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: t("Error"),
        message: t("Failed to update project"),
        color: "red",
      });
    },
  });
}
