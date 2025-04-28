import { useMemo } from "react";
import {
  useTasksByProject,
  useUpdateTaskMutation,
} from "../../hooks/use-tasks";
import { Task, TaskPriority, TaskStatus } from "../../types";
import { useWorkspaceUsers } from "@/features/user/hooks/use-workspace-users";
import dayjs from "dayjs";

/**
 * Custom hook to get filtered and sorted tasks for a project
 */
export function useFilteredTasks({
  projectId,
  statusFilter,
  priorityFilter,
  assigneeFilter,
  labelFilter,
  searchTerm,
  showCompletedTasks,
  dateRangeFilter,
  sortBy,
  sortOrder,
}: {
  projectId: string;
  statusFilter: TaskStatus[];
  priorityFilter: TaskPriority[];
  assigneeFilter: string[];
  labelFilter: string[];
  searchTerm: string;
  showCompletedTasks: boolean;
  dateRangeFilter: [Date | null, Date | null];
  sortBy: "priority" | "dueDate" | "createdAt" | "title";
  sortOrder: "asc" | "desc";
}) {
  const { data: tasksData, isLoading: isTasksLoading } = useTasksByProject({
    projectId,
  });

  const filteredTasks = useMemo(() => {
    if (!tasksData) return [];
    let filtered = [...tasksData.items];

    // Apply filters
    if (statusFilter.length > 0) {
      filtered = filtered.filter((task) => statusFilter.includes(task.status));
    }

    if (priorityFilter.length > 0) {
      filtered = filtered.filter(
        (task) => task.priority && priorityFilter.includes(task.priority)
      );
    }

    if (assigneeFilter.length > 0) {
      filtered = filtered.filter(
        (task) => task.assigneeId && assigneeFilter.includes(task.assigneeId)
      );
    }

    if (labelFilter.length > 0) {
      filtered = filtered.filter(
        (task) =>
          task.labels &&
          task.labels.some((label) => labelFilter.includes(label.id))
      );
    }

    if (!showCompletedTasks) {
      filtered = filtered.filter((task) => task.status !== "done");
    }

    // Apply search term
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(term) ||
          (task.description && task.description.toLowerCase().includes(term))
      );
    }

    // Apply date range filter
    if (dateRangeFilter[0] && dateRangeFilter[1]) {
      const startDate = dayjs(dateRangeFilter[0]);
      const endDate = dayjs(dateRangeFilter[1]);

      filtered = filtered.filter((task) => {
        if (!task.dueDate) return false;
        const taskDate = dayjs(task.dueDate);
        return (
          taskDate.isSameOrAfter(startDate, "day") &&
          taskDate.isSameOrBefore(endDate, "day")
        );
      });
    } else if (dateRangeFilter[0]) {
      const startDate = dayjs(dateRangeFilter[0]);
      filtered = filtered.filter((task) => {
        if (!task.dueDate) return false;
        return dayjs(task.dueDate).isSameOrAfter(startDate, "day");
      });
    } else if (dateRangeFilter[1]) {
      const endDate = dayjs(dateRangeFilter[1]);
      filtered = filtered.filter((task) => {
        if (!task.dueDate) return false;
        return dayjs(task.dueDate).isSameOrBefore(endDate, "day");
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === "priority") {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = a.priority ? priorityOrder[a.priority] || 0 : 0;
        const bPriority = b.priority ? priorityOrder[b.priority] || 0 : 0;
        return sortOrder === "asc"
          ? aPriority - bPriority
          : bPriority - aPriority;
      } else if (sortBy === "dueDate") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return sortOrder === "asc" ? 1 : -1;
        if (!b.dueDate) return sortOrder === "asc" ? -1 : 1;

        const aDate = new Date(a.dueDate).getTime();
        const bDate = new Date(b.dueDate).getTime();
        return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
      } else if (sortBy === "createdAt") {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
      } else {
        // title
        return sortOrder === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
    });

    return filtered;
  }, [
    tasksData,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    labelFilter,
    searchTerm,
    showCompletedTasks,
    dateRangeFilter,
    sortBy,
    sortOrder,
  ]);

  return {
    tasks: filteredTasks,
    isLoading: isTasksLoading,
    rawTasks: tasksData?.items || [],
  };
}

/**
 * Custom hook to get tasks grouped by a specific criteria
 */
export function useGroupedTasks({
  tasks,
  groupBy,
  workspaceId,
}: {
  tasks: Task[];
  groupBy: "status" | "assignee" | "priority" | "date" | "labels";
  workspaceId: string;
}) {
  // Get workspace users for assignee grouping
  const { data: usersData, isLoading: isUsersLoading } = useWorkspaceUsers({
    workspaceId,
  });
  const users = usersData?.items || [];

  const groupedTasks = useMemo(() => {
    if (groupBy === "status") {
      const statusGroups: Record<TaskStatus, Task[]> = {
        todo: [],
        in_progress: [],
        in_review: [],
        blocked: [],
        done: [],
      };

      tasks.forEach((task) => {
        if (statusGroups[task.status]) {
          statusGroups[task.status].push(task);
        }
      });

      return statusGroups;
    } else if (groupBy === "assignee") {
      const assigneeGroups: Record<string, Task[]> = {};
      const unassigned: Task[] = [];

      tasks.forEach((task) => {
        if (!task.assigneeId) {
          unassigned.push(task);
        } else {
          if (!assigneeGroups[task.assigneeId]) {
            assigneeGroups[task.assigneeId] = [];
          }
          assigneeGroups[task.assigneeId].push(task);
        }
      });

      // Add unassigned group
      return { ...assigneeGroups, unassigned };
    } else if (groupBy === "priority") {
      const priorityGroups: Record<TaskPriority | "none", Task[]> = {
        urgent: [],
        high: [],
        medium: [],
        low: [],
        none: [],
      };

      tasks.forEach((task) => {
        if (task.priority) {
          priorityGroups[task.priority].push(task);
        } else {
          priorityGroups.none.push(task);
        }
      });

      return priorityGroups;
    } else if (groupBy === "date") {
      const today = dayjs().startOf("day");
      const tomorrow = today.add(1, "day");
      const nextWeek = today.add(7, "day");

      const dateGroups: Record<string, Task[]> = {
        overdue: [],
        today: [],
        tomorrow: [],
        thisWeek: [],
        later: [],
        noDueDate: [],
      };

      tasks.forEach((task) => {
        if (!task.dueDate) {
          dateGroups.noDueDate.push(task);
          return;
        }

        const dueDate = dayjs(task.dueDate).startOf("day");

        if (dueDate.isBefore(today)) {
          dateGroups.overdue.push(task);
        } else if (dueDate.isSame(today)) {
          dateGroups.today.push(task);
        } else if (dueDate.isSame(tomorrow)) {
          dateGroups.tomorrow.push(task);
        } else if (dueDate.isBefore(nextWeek)) {
          dateGroups.thisWeek.push(task);
        } else {
          dateGroups.later.push(task);
        }
      });

      return dateGroups;
    } else if (groupBy === "labels") {
      const labelGroups: Record<string, Task[]> = {};
      const noLabels: Task[] = [];

      tasks.forEach((task) => {
        if (!task.labels || task.labels.length === 0) {
          noLabels.push(task);
        } else {
          task.labels.forEach((label) => {
            if (!labelGroups[label.id]) {
              labelGroups[label.id] = [];
            }
            labelGroups[label.id].push(task);
          });
        }
      });

      // Add no labels group
      return { ...labelGroups, noLabels };
    }

    // Default - return by status
    return {};
  }, [tasks, groupBy, users]);

  return {
    groupedTasks,
    users,
    isLoading: isUsersLoading,
  };
}

/**
 * Custom hook for task operations
 */
export function useTaskOperations() {
  const updateTaskMutation = useUpdateTaskMutation();

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    return updateTaskMutation.mutate({
      taskId,
      status,
    });
  };

  const updateTaskAssignee = async (
    taskId: string,
    assigneeId: string | null
  ) => {
    return updateTaskMutation.mutate({
      taskId,
      assigneeId,
    });
  };

  const updateTaskPriority = async (taskId: string, priority: TaskPriority) => {
    return updateTaskMutation.mutate({
      taskId,
      priority,
    });
  };

  return {
    updateTaskStatus,
    updateTaskAssignee,
    updateTaskPriority,
    isUpdating: updateTaskMutation.isPending,
  };
}
