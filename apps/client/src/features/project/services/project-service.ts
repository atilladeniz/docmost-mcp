import api from "@/lib/api-client";
import {
  CreateProjectParams,
  CreateTaskParams,
  Project,
  ProjectListParams,
  Task,
  TaskListBySpaceParams,
  TaskListParams,
  UpdateProjectParams,
  UpdateTaskParams,
} from "../types";
import { IPagination } from "@/lib/types";

// Check if we're in development mode
const isDevelopment = import.meta.env?.DEV;

// Only log in production or if explicitly enabled
const shouldLog =
  !isDevelopment || import.meta.env?.VITE_ENABLE_LOGS === "true";

// Helper function to conditionally log
const conditionalLog = (message: string, data?: any) => {
  if (shouldLog) {
    console.log(message, data);
  }
};

// Helper function to conditionally log errors
const conditionalErrorLog = (message: string, error?: any) => {
  if (shouldLog || error?.response?.status >= 400) {
    console.error(message, error);
  }
};

// Restore the original endpoint pattern
const PROJECTS_ENDPOINT = "projects";
const TASKS_ENDPOINT = "tasks";

export const projectService = {
  // Project endpoints
  async getProjectById(projectId: string): Promise<Project> {
    const { data } = await api.post(`${PROJECTS_ENDPOINT}/info`, { projectId });
    return data;
  },

  async listProjects(params: ProjectListParams): Promise<any> {
    conditionalLog("Project service: listProjects called with params:", params);
    console.log("Fetching projects with params:", params);

    try {
      const response = await api.post(`${PROJECTS_ENDPOINT}/list`, params);

      console.log("Project listProjects API response:", {
        status: response.status,
        fullResponse: response,
        data: response.data,
        keys: Object.keys(response.data),
      });

      return response.data;
    } catch (error) {
      console.error("Project listProjects API error:", {
        message: error.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        responseData: error?.response?.data,
      });

      // Return empty result instead of mock data
      return { items: [], meta: { total: 0 } };
    }
  },

  async createProject(params: CreateProjectParams): Promise<Project> {
    console.time("project-creation");
    console.log(
      "Project service: Starting createProject API call",
      new Date().toISOString()
    );

    try {
      const { data } = await api.post(`${PROJECTS_ENDPOINT}/create`, params);
      console.log(
        "Project service: Completed createProject API call",
        new Date().toISOString()
      );
      console.timeEnd("project-creation");
      return data;
    } catch (error) {
      console.error("Project service: Error in createProject", error);
      console.timeEnd("project-creation");
      throw error;
    }
  },

  async updateProject(params: UpdateProjectParams): Promise<Project> {
    conditionalLog(
      "Project service: updateProject called with params:",
      params
    );

    // Enhanced debugging
    console.log("UpdateProject API request details:", {
      endpoint: `${PROJECTS_ENDPOINT}/update`,
      fullParams: params,
      projectId: params.projectId,
    });

    try {
      // Log the actual API call
      console.log(`Making POST request to: /api/${PROJECTS_ENDPOINT}/update`);

      const { data } = await api.post(`${PROJECTS_ENDPOINT}/update`, params);

      conditionalLog(
        "Project service: updateProject successful response:",
        data
      );
      return data;
    } catch (error) {
      conditionalErrorLog("Project service: updateProject error:", error);
      console.error("Full error details:", {
        message: error.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        responseData: error?.response?.data,
      });
      throw error;
    }
  },

  async deleteProject(projectId: string): Promise<{ success: boolean }> {
    const { data } = await api.post(`${PROJECTS_ENDPOINT}/delete`, {
      projectId,
    });
    return data;
  },

  async archiveProject(
    projectId: string,
    isArchived: boolean
  ): Promise<Project> {
    const { data } = await api.post(`${PROJECTS_ENDPOINT}/archive`, {
      projectId,
      isArchived,
    });
    return data;
  },

  // Task endpoints
  async getTaskById(taskId: string): Promise<Task> {
    const { data } = await api.post(`${TASKS_ENDPOINT}/info`, { taskId });
    return data;
  },

  async listTasksByProject(params: TaskListParams): Promise<IPagination<Task>> {
    const { data } = await api.post(
      `${TASKS_ENDPOINT}/list-by-project`,
      params
    );
    return data;
  },

  async listTasksBySpace(
    params: TaskListBySpaceParams
  ): Promise<IPagination<Task>> {
    const { data } = await api.post(`${TASKS_ENDPOINT}/list-by-space`, params);
    return data;
  },

  async createTask(params: CreateTaskParams): Promise<Task> {
    const { data } = await api.post(`${TASKS_ENDPOINT}/create`, params);
    return data;
  },

  async updateTask(params: UpdateTaskParams): Promise<Task> {
    const { data } = await api.post(`${TASKS_ENDPOINT}/update`, params);
    return data;
  },

  async deleteTask(taskId: string): Promise<{ success: boolean }> {
    const { data } = await api.post(`${TASKS_ENDPOINT}/delete`, { taskId });
    return data;
  },

  async assignTask(taskId: string, assigneeId?: string): Promise<Task> {
    const { data } = await api.post(`${TASKS_ENDPOINT}/assign`, {
      taskId,
      assigneeId,
    });
    return data;
  },

  async completeTask(taskId: string, isCompleted: boolean): Promise<Task> {
    const { data } = await api.post(`${TASKS_ENDPOINT}/complete`, {
      taskId,
      isCompleted,
    });
    return data;
  },

  async moveTaskToProject(taskId: string, projectId?: string): Promise<Task> {
    const { data } = await api.post(`${TASKS_ENDPOINT}/move-to-project`, {
      taskId,
      projectId,
    });
    return data;
  },
};
