import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  Grid,
  Group,
  Title,
  Text,
  Badge,
  RingProgress,
  Stack,
  Paper,
  SimpleGrid,
  useMantineTheme,
  Flex,
  Divider,
  rem,
} from "@mantine/core";
import { useTasksBySpace } from "../hooks/use-tasks";
import { useProjects } from "../hooks/use-projects";
import { Project, Task, TaskPriority, TaskStatus } from "../types";
import { useTranslation } from "react-i18next";
import {
  IconAlertCircle,
  IconArrowUp,
  IconCalendarTime,
  IconCheck,
  IconCheckbox,
  IconClipboard,
  IconProgress,
  IconUser,
} from "@tabler/icons-react";

interface ProjectDashboardProps {
  spaceId: string;
  onSelectProject: (project: Project) => void;
}

export function ProjectDashboard({
  spaceId,
  onSelectProject,
}: ProjectDashboardProps) {
  const { t } = useTranslation();
  const theme = useMantineTheme();

  const { data: projectsData, isLoading: projectsLoading } = useProjects({
    spaceId,
    includeArchived: false,
  });

  const { data: tasksData, isLoading: tasksLoading } = useTasksBySpace({
    spaceId,
  });

  const projects = projectsData?.items || [];
  const tasks = tasksData?.items || [];

  const isLoading = projectsLoading || tasksLoading;

  // Project statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (project) => !project.isArchived
  ).length;

  // Task statistics
  const tasksByStatus = useMemo(() => {
    const result: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
      blocked: [],
    };

    tasks.forEach((task) => {
      result[task.status].push(task);
    });

    return result;
  }, [tasks]);

  const tasksByPriority = useMemo(() => {
    const result: Record<TaskPriority, Task[]> = {
      low: [],
      medium: [],
      high: [],
      urgent: [],
    };

    tasks.forEach((task) => {
      if (task.priority) {
        result[task.priority].push(task);
      }
    });

    return result;
  }, [tasks]);

  // Calculate completion rates
  const completionRate = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((tasksByStatus.done.length / tasks.length) * 100);
  }, [tasks, tasksByStatus]);

  // Find upcoming tasks (due in the next 7 days)
  const upcomingTasks = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    return tasks
      .filter((task) => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= now && dueDate <= nextWeek && task.status !== "done";
      })
      .sort((a, b) => {
        return new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime();
      });
  }, [tasks]);

  // Find most active project (with most tasks)
  const projectWithMostTasks = useMemo(() => {
    const projectTaskCount: Record<string, number> = {};

    tasks.forEach((task) => {
      if (task.projectId) {
        projectTaskCount[task.projectId] =
          (projectTaskCount[task.projectId] || 0) + 1;
      }
    });

    let maxCount = 0;
    let maxProjectId = null;

    for (const [projectId, count] of Object.entries(projectTaskCount)) {
      if (count > maxCount) {
        maxCount = count;
        maxProjectId = projectId;
      }
    }

    return projects.find((p) => p.id === maxProjectId);
  }, [tasks, projects]);

  return (
    <Stack>
      <Title order={2}>{t("Project Dashboard")}</Title>

      {/* Summary Cards */}
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              {t("Total Projects")}
            </Text>
            <IconClipboard
              size="1.5rem"
              stroke={1.5}
              color={theme.colors.blue[6]}
            />
          </Group>
          <Text fw={700} size="xl" mt="md">
            {totalProjects}
          </Text>
          <Text size="xs" c="dimmed" mt={7}>
            {t("{count} active", { count: activeProjects })}
          </Text>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              {t("Total Tasks")}
            </Text>
            <IconCheckbox
              size="1.5rem"
              stroke={1.5}
              color={theme.colors.indigo[6]}
            />
          </Group>
          <Text fw={700} size="xl" mt="md">
            {tasks.length}
          </Text>
          <Text size="xs" c="dimmed" mt={7}>
            {t("{count} completed", { count: tasksByStatus.done.length })}
          </Text>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              {t("Completion Rate")}
            </Text>
            <IconCheck
              size="1.5rem"
              stroke={1.5}
              color={theme.colors.teal[6]}
            />
          </Group>
          <Text fw={700} size="xl" mt="md">
            {completionRate}%
          </Text>
          <Text size="xs" c="dimmed" mt={7}>
            {t("of all tasks")}
          </Text>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              {t("Urgent Tasks")}
            </Text>
            <IconAlertCircle
              size="1.5rem"
              stroke={1.5}
              color={theme.colors.red[6]}
            />
          </Group>
          <Text fw={700} size="xl" mt="md">
            {tasksByPriority.urgent.length}
          </Text>
          <Text size="xs" c="dimmed" mt={7}>
            {t("need attention")}
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Task Status Distribution */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper withBorder p="md" radius="md">
            <Title order={4} mb="md">
              {t("Task Status Distribution")}
            </Title>
            <Group wrap="nowrap" gap="xl">
              <RingProgress
                size={160}
                thickness={16}
                roundCaps
                sections={[
                  {
                    value:
                      (tasksByStatus.todo.length / Math.max(tasks.length, 1)) *
                      100,
                    color: theme.colors.gray[6],
                  },
                  {
                    value:
                      (tasksByStatus.in_progress.length /
                        Math.max(tasks.length, 1)) *
                      100,
                    color: theme.colors.blue[6],
                  },
                  {
                    value:
                      (tasksByStatus.in_review.length /
                        Math.max(tasks.length, 1)) *
                      100,
                    color: theme.colors.indigo[6],
                  },
                  {
                    value:
                      (tasksByStatus.done.length / Math.max(tasks.length, 1)) *
                      100,
                    color: theme.colors.green[6],
                  },
                  {
                    value:
                      (tasksByStatus.blocked.length /
                        Math.max(tasks.length, 1)) *
                      100,
                    color: theme.colors.red[6],
                  },
                ]}
                label={
                  <div style={{ textAlign: "center" }}>
                    <Text fw={700} size="xl" ta="center">
                      {tasks.length}
                    </Text>
                    <Text size="xs" c="dimmed" ta="center">
                      {t("Total")}
                    </Text>
                  </div>
                }
              />
              <Stack gap="xs">
                <Group gap="xs">
                  <Box
                    w={16}
                    h={16}
                    bg={theme.colors.gray[6]}
                    style={{ borderRadius: "4px" }}
                  />
                  <Text size="sm">
                    {t("To Do")}: {tasksByStatus.todo.length}
                  </Text>
                </Group>
                <Group gap="xs">
                  <Box
                    w={16}
                    h={16}
                    bg={theme.colors.blue[6]}
                    style={{ borderRadius: "4px" }}
                  />
                  <Text size="sm">
                    {t("In Progress")}: {tasksByStatus.in_progress.length}
                  </Text>
                </Group>
                <Group gap="xs">
                  <Box
                    w={16}
                    h={16}
                    bg={theme.colors.indigo[6]}
                    style={{ borderRadius: "4px" }}
                  />
                  <Text size="sm">
                    {t("In Review")}: {tasksByStatus.in_review.length}
                  </Text>
                </Group>
                <Group gap="xs">
                  <Box
                    w={16}
                    h={16}
                    bg={theme.colors.green[6]}
                    style={{ borderRadius: "4px" }}
                  />
                  <Text size="sm">
                    {t("Done")}: {tasksByStatus.done.length}
                  </Text>
                </Group>
                <Group gap="xs">
                  <Box
                    w={16}
                    h={16}
                    bg={theme.colors.red[6]}
                    style={{ borderRadius: "4px" }}
                  />
                  <Text size="sm">
                    {t("Blocked")}: {tasksByStatus.blocked.length}
                  </Text>
                </Group>
              </Stack>
            </Group>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper withBorder p="md" radius="md">
            <Title order={4} mb="md">
              {t("Priority Breakdown")}
            </Title>
            <Group wrap="nowrap" gap="xl">
              <RingProgress
                size={160}
                thickness={16}
                roundCaps
                sections={[
                  {
                    value:
                      (tasksByPriority.low.length / Math.max(tasks.length, 1)) *
                      100,
                    color: theme.colors.gray[6],
                  },
                  {
                    value:
                      (tasksByPriority.medium.length /
                        Math.max(tasks.length, 1)) *
                      100,
                    color: theme.colors.blue[6],
                  },
                  {
                    value:
                      (tasksByPriority.high.length /
                        Math.max(tasks.length, 1)) *
                      100,
                    color: theme.colors.orange[6],
                  },
                  {
                    value:
                      (tasksByPriority.urgent.length /
                        Math.max(tasks.length, 1)) *
                      100,
                    color: theme.colors.red[6],
                  },
                ]}
                label={
                  <div style={{ textAlign: "center" }}>
                    <Text fw={700} size="xl" ta="center">
                      {tasks.length}
                    </Text>
                    <Text size="xs" c="dimmed" ta="center">
                      {t("Total")}
                    </Text>
                  </div>
                }
              />
              <Stack gap="xs">
                <Group gap="xs">
                  <Box
                    w={16}
                    h={16}
                    bg={theme.colors.gray[6]}
                    style={{ borderRadius: "4px" }}
                  />
                  <Text size="sm">
                    {t("Low")}: {tasksByPriority.low.length}
                  </Text>
                </Group>
                <Group gap="xs">
                  <Box
                    w={16}
                    h={16}
                    bg={theme.colors.blue[6]}
                    style={{ borderRadius: "4px" }}
                  />
                  <Text size="sm">
                    {t("Medium")}: {tasksByPriority.medium.length}
                  </Text>
                </Group>
                <Group gap="xs">
                  <Box
                    w={16}
                    h={16}
                    bg={theme.colors.orange[6]}
                    style={{ borderRadius: "4px" }}
                  />
                  <Text size="sm">
                    {t("High")}: {tasksByPriority.high.length}
                  </Text>
                </Group>
                <Group gap="xs">
                  <Box
                    w={16}
                    h={16}
                    bg={theme.colors.red[6]}
                    style={{ borderRadius: "4px" }}
                  />
                  <Text size="sm">
                    {t("Urgent")}: {tasksByPriority.urgent.length}
                  </Text>
                </Group>
              </Stack>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Upcoming Deadlines and Project Highlights */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Paper withBorder p="md" radius="md">
            <Title order={4} mb="md">
              {t("Upcoming Deadlines")}
            </Title>
            {upcomingTasks.length > 0 ? (
              <Stack gap="sm">
                {upcomingTasks.slice(0, 5).map((task) => (
                  <Paper key={task.id} withBorder p="sm" radius="sm">
                    <Group justify="space-between">
                      <Stack gap={4}>
                        <Text fw={500}>{task.title}</Text>
                        <Group gap="xs">
                          <Badge
                            size="sm"
                            color={
                              task.priority === "urgent"
                                ? "red"
                                : task.priority === "high"
                                  ? "orange"
                                  : task.priority === "medium"
                                    ? "blue"
                                    : "gray"
                            }
                          >
                            {task.priority}
                          </Badge>
                          <Badge
                            size="sm"
                            color={
                              task.status === "blocked"
                                ? "red"
                                : task.status === "in_progress"
                                  ? "blue"
                                  : task.status === "in_review"
                                    ? "indigo"
                                    : task.status === "done"
                                      ? "green"
                                      : "gray"
                            }
                          >
                            {task.status}
                          </Badge>
                        </Group>
                      </Stack>
                      <Group gap="xs">
                        <IconCalendarTime size={16} />
                        <Text size="sm" c="dimmed">
                          {new Date(
                            task.dueDate as string
                          ).toLocaleDateString()}
                        </Text>
                      </Group>
                    </Group>
                  </Paper>
                ))}
                {upcomingTasks.length > 5 && (
                  <Text ta="center" size="sm" c="dimmed">
                    {t("and {count} more tasks", {
                      count: upcomingTasks.length - 5,
                    })}
                  </Text>
                )}
              </Stack>
            ) : (
              <Text ta="center" c="dimmed">
                {t("No upcoming deadlines")}
              </Text>
            )}
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}>
          {projectWithMostTasks ? (
            <Paper withBorder p="md" radius="md" h="100%">
              <Title order={4} mb="md">
                {t("Most Active Project")}
              </Title>
              <Card withBorder radius="md" p="md">
                <Group mb="xs">
                  {projectWithMostTasks.icon && (
                    <Text size="xl" span>
                      {projectWithMostTasks.icon}
                    </Text>
                  )}
                  <Text fw={500}>{projectWithMostTasks.name}</Text>
                </Group>

                {projectWithMostTasks.description && (
                  <Text size="sm" lineClamp={2} mb="sm" c="dimmed">
                    {projectWithMostTasks.description}
                  </Text>
                )}

                <Divider my="sm" />

                <Stack gap="xs">
                  <Group gap="xs">
                    <IconCheckbox size={16} />
                    <Text size="sm">
                      {
                        tasks.filter(
                          (t) => t.projectId === projectWithMostTasks.id
                        ).length
                      }{" "}
                      {t("tasks")}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <IconCheck size={16} />
                    <Text size="sm">
                      {
                        tasks.filter(
                          (t) =>
                            t.projectId === projectWithMostTasks.id &&
                            t.status === "done"
                        ).length
                      }{" "}
                      {t("completed")}
                    </Text>
                  </Group>
                </Stack>
              </Card>
            </Paper>
          ) : (
            <Paper withBorder p="md" radius="md" h="100%">
              <Title order={4} mb="md">
                {t("Project Highlight")}
              </Title>
              <Text ta="center" c="dimmed">
                {t("No project data available")}
              </Text>
            </Paper>
          )}
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
