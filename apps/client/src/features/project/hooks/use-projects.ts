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
const PROJECT_QUERY_KEY = "project";

export function useProjects(params: ProjectListParams) {
  return useQuery({
    queryKey: [PROJECTS_QUERY_KEY, params],
    queryFn: async () => {
      console.log("Fetching projects with params:", params);
      const result = await projectService.listProjects(params);
      console.log("Projects fetched:", result);
      return result;
    },
    enabled: !!params.spaceId,
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: [PROJECT_QUERY_KEY, projectId],
    queryFn: () => projectService.getProjectById(projectId),
    enabled: !!projectId,
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (params: CreateProjectParams) => {
      console.log("Creating project with params:", params);
      const result = await projectService.createProject(params);
      console.log("Project created:", result);
      return result;
    },
    onSuccess: (data, variables) => {
      const queryParams = { spaceId: variables.spaceId };
      console.log(
        "Project creation successful, invalidating queries with key:",
        [PROJECTS_QUERY_KEY, queryParams]
      );

      queryClient.invalidateQueries({
        queryKey: [PROJECTS_QUERY_KEY, queryParams],
      });

      queryClient.invalidateQueries({
        queryKey: [PROJECTS_QUERY_KEY],
      });

      const projectName = data?.name || variables.name || "";

      notifications.show({
        title: t("Project created"),
        message: t("Project {{name}} has been created", {
          name: projectName,
        }),
        color: "green",
      });
    },
    onError: (error) => {
      console.error("Project creation error:", error);
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
        queryKey: [PROJECT_QUERY_KEY, data.id],
      });
      queryClient.invalidateQueries({
        queryKey: [PROJECTS_QUERY_KEY, { spaceId: data.spaceId }],
      });

      const projectName = data?.name || "";

      notifications.show({
        title: t("Project updated"),
        message: t("Project {{name}} has been updated", { name: projectName }),
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [PROJECT_QUERY_KEY, data.id],
      });
      queryClient.invalidateQueries({
        queryKey: [PROJECTS_QUERY_KEY, { spaceId: data.spaceId }],
      });

      const projectName = data?.name || "";

      notifications.show({
        title: data.isArchived
          ? t("Project archived")
          : t("Project unarchived"),
        message: data.isArchived
          ? t("Project {{name}} has been archived", { name: projectName })
          : t("Project {{name}} has been unarchived", { name: projectName }),
        color: "green",
      });
    },
    onError: (error) => {
      notifications.show({
        title: t("Error"),
        message: t("Failed to archive/unarchive project"),
        color: "red",
      });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      projectId,
      projectName,
    }: {
      projectId: string;
      projectName?: string;
    }) => projectService.deleteProject(projectId),
    onSuccess: (_, variables) => {
      queryClient.removeQueries({
        queryKey: [PROJECT_QUERY_KEY, variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: [PROJECTS_QUERY_KEY],
      });

      const name = variables.projectName || "";

      notifications.show({
        title: t("Project deleted"),
        message: name
          ? t("Project {{name}} has been deleted", { name })
          : t("Project has been deleted"),
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
