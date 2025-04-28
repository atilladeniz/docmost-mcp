import { useMemo } from "react";
import { useTasksBySpace } from "../../hooks/use-tasks";
import { useProjects } from "../../hooks/use-projects";
import { Project, Task } from "../../types";

/**
 * Hook to fetch and organize dashboard data
 */
export function useDashboardData({ spaceId }: { spaceId: string }) {
  // Fetch projects
  const { data: projectsData, isLoading: isProjectsLoading } = useProjects({
    spaceId,
  });

  // Fetch tasks
  const { data: tasksData, isLoading: isTasksLoading } = useTasksBySpace({
    spaceId,
  });

  // Handle both possible structures from the API
  const projects = useMemo(() => {
    let projectArray: Project[] = [];
    if (projectsData) {
      if (Array.isArray(projectsData.data)) {
        // Structure: { data: Project[], pagination: {...} }
        projectArray = projectsData.data;
      } else if (Array.isArray(projectsData.items)) {
        // Structure: { items: Project[], meta: {...} }
        projectArray = projectsData.items;
      }
    }
    return projectArray;
  }, [projectsData]);

  const allTasks = tasksData?.items || [];

  // Aggregate tasks by project
  const tasksByProject = useMemo(() => {
    const taskMap = new Map<string, Task[]>();

    allTasks.forEach((task) => {
      if (!taskMap.has(task.projectId)) {
        taskMap.set(task.projectId, []);
      }
      taskMap.get(task.projectId)?.push(task);
    });

    return taskMap;
  }, [allTasks]);

  // Calculate task statistics
  const taskStats = useMemo(() => {
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(
      (task) => task.status === "done"
    ).length;
    const inProgressTasks = allTasks.filter(
      (task) => task.status === "in_progress"
    ).length;
    const blockedTasks = allTasks.filter(
      (task) => task.status === "blocked"
    ).length;

    const highPriorityTasks = allTasks.filter(
      (task) => task.priority === "high" || task.priority === "urgent"
    ).length;
    const tasksWithDueDate = allTasks.filter((task) => task.dueDate).length;

    // Calculate due soon tasks (due within 7 days)
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const dueSoonTasks = allTasks.filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return (
        dueDate > now && dueDate <= sevenDaysFromNow && task.status !== "done"
      );
    });

    // Calculate overdue tasks
    const overdueTasks = allTasks.filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < now && task.status !== "done";
    });

    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      highPriorityTasks,
      dueSoonTasks: dueSoonTasks.length,
      overdueTasks: overdueTasks.length,
      tasksWithDueDate,
      completionRate,
    };
  }, [allTasks]);

  // Get project with most tasks
  const projectWithMostTasks = useMemo(() => {
    if (projects.length === 0) return null;

    let maxTaskCount = 0;
    let projectWithMax: Project | null = null;

    projects.forEach((project) => {
      const taskCount = tasksByProject.get(project.id)?.length || 0;
      if (taskCount > maxTaskCount) {
        maxTaskCount = taskCount;
        projectWithMax = project;
      }
    });

    return {
      project: projectWithMax,
      taskCount: maxTaskCount,
    };
  }, [projects, tasksByProject]);

  // Get project completion rates
  const projectCompletionRates = useMemo(() => {
    return projects
      .map((project) => {
        const projectTasks = tasksByProject.get(project.id) || [];
        const totalCount = projectTasks.length;
        const completedCount = projectTasks.filter(
          (task) => task.status === "done"
        ).length;
        const completionRate =
          totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

        return {
          project,
          totalCount,
          completedCount,
          completionRate,
        };
      })
      .sort((a, b) => b.totalCount - a.totalCount);
  }, [projects, tasksByProject]);

  return {
    projects,
    allTasks,
    tasksByProject,
    taskStats,
    projectWithMostTasks,
    projectCompletionRates,
    isLoading: isProjectsLoading || isTasksLoading,
  };
}
