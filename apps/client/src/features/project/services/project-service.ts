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

const PROJECTS_ENDPOINT = "/projects";
const TASKS_ENDPOINT = "/tasks";

export const projectService = {
  // Project endpoints
  async getProjectById(projectId: string): Promise<Project> {
    const { data } = await api.post(`${PROJECTS_ENDPOINT}/info`, { projectId });
    return data;
  },

  async listProjects(params: ProjectListParams): Promise<any> {
    const response = await api.post(`${PROJECTS_ENDPOINT}/list`, params);
    console.log("API response structure:", {
      fullResponse: response,
      data: response.data,
      keys: Object.keys(response.data),
    });
    return response.data;
  },

  async createProject(params: CreateProjectParams): Promise<Project> {
    const { data } = await api.post(`${PROJECTS_ENDPOINT}/create`, params);
    return data;
  },

  async updateProject(params: UpdateProjectParams): Promise<Project> {
    const { data } = await api.post(`${PROJECTS_ENDPOINT}/update`, params);
    return data;
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
