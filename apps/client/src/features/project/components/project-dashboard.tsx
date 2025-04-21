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
  Progress,
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
  IconUsers,
  IconChartBar,
  IconListCheck,
  IconAlarm,
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
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  const { data: projectsData, isLoading: isProjectsLoading } = useProjects({
    spaceId,
  });

  const { data: tasksData, isLoading: isTasksLoading } = useTasksBySpace({
    spaceId,
  });

  const projects = projectsData?.items || [];
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

  return (
    <Stack spacing="xl">
      <Title order={2} mb="md">
        {t("Project Dashboard")}
      </Title>

      {/* Summary cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <Card withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              {t("Total Tasks")}
            </Text>
            <IconClipboard size={20} color={theme.colors.blue[6]} />
          </Group>
          <Group justify="space-between" mt="xs">
            <Text size="xl" fw={700}>
              {taskStats.totalTasks}
            </Text>
            <Badge color="blue" variant="light">
              {projects.length} {t("Projects")}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed" mt="md">
            <span>
              {taskStats.completedTasks} {t("completed")}
            </span>
            <span> • </span>
            <span>
              {taskStats.inProgressTasks} {t("in progress")}
            </span>
          </Text>
        </Card>

        <Card withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              {t("Completion Rate")}
            </Text>
            <IconCheckbox size={20} color={theme.colors.green[6]} />
          </Group>
          <Group justify="space-between" mt="xs" wrap="nowrap">
            <Text size="xl" fw={700}>
              {taskStats.completionRate.toFixed(0)}%
            </Text>
            <RingProgress
              size={50}
              roundCaps
              thickness={4}
              sections={[
                {
                  value: taskStats.completionRate,
                  color: theme.colors.green[6],
                },
              ]}
            />
          </Group>
          <Progress
            value={taskStats.completionRate}
            color="green"
            size="sm"
            mt="md"
          />
        </Card>

        <Card withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              {t("Priority Tasks")}
            </Text>
            <IconAlertCircle size={20} color={theme.colors.orange[6]} />
          </Group>
          <Group justify="space-between" mt="xs">
            <Text size="xl" fw={700}>
              {taskStats.highPriorityTasks}
            </Text>
            <Badge color="orange" variant="light">
              {taskStats.highPriorityTasks > 0
                ? t("Needs Attention")
                : t("All Clear")}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed" mt="md">
            <span>
              {taskStats.dueSoonTasks} {t("due soon")}
            </span>
            <span> • </span>
            <span>
              {taskStats.overdueTasks} {t("overdue")}
            </span>
          </Text>
        </Card>

        <Card withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              {t("Blocked Tasks")}
            </Text>
            <IconProgress size={20} color={theme.colors.red[6]} />
          </Group>
          <Group justify="space-between" mt="xs">
            <Text size="xl" fw={700}>
              {taskStats.blockedTasks}
            </Text>
            <Badge
              color={taskStats.blockedTasks > 0 ? "red" : "green"}
              variant="light"
            >
              {taskStats.blockedTasks > 0
                ? t("Action Required")
                : t("No Blockers")}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed" mt="md">
            {taskStats.blockedTasks > 0
              ? t("Items requiring intervention")
              : t("All tasks are unblocked")}
          </Text>
        </Card>
      </SimpleGrid>

      {/* Project status */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Paper withBorder p="md" radius="md">
            <Title order={3} size="h4" mb="md">
              {t("Project Status")}
            </Title>
            <Stack>
              {projectCompletionRates
                .slice(0, 5)
                .map(
                  ({ project, totalCount, completedCount, completionRate }) => (
                    <Box key={project.id}>
                      <Group justify="space-between" mb={5}>
                        <Text size="sm" fw={500}>
                          {project.name}
                        </Text>
                        <Group gap={5}>
                          <Text size="xs" c="dimmed">
                            {completedCount}/{totalCount}
                          </Text>
                          <Text
                            size="xs"
                            fw={700}
                            c={
                              completionRate >= 70
                                ? "green"
                                : completionRate >= 30
                                  ? "orange"
                                  : "red"
                            }
                          >
                            {completionRate.toFixed(0)}%
                          </Text>
                        </Group>
                      </Group>
                      <Progress
                        value={completionRate}
                        color={
                          completionRate >= 70
                            ? "green"
                            : completionRate >= 30
                              ? "orange"
                              : "red"
                        }
                        size="sm"
                        radius="xl"
                        mb="md"
                      />
                    </Box>
                  )
                )}

              {projectCompletionRates.length === 0 && (
                <Text color="dimmed" size="sm" ta="center" py="md">
                  {t("No projects available")}
                </Text>
              )}
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Title order={3} size="h4" mb="md">
              {t("Task Distribution")}
            </Title>

            <Stack gap="xs">
              <Group justify="space-between">
                <Group>
                  <Box
                    w={16}
                    h={16}
                    bg={theme.colors.blue[5]}
                    style={{ borderRadius: "50%" }}
                  />
                  <Text size="sm">{t("To Do")}</Text>
                </Group>
                <Text size="sm" fw={500}>
                  {allTasks.filter((t) => t.status === "todo").length}
                </Text>
              </Group>

              <Group justify="space-between">
                <Group>
                  <Box
                    w={16}
                    h={16}
                    bg={theme.colors.indigo[5]}
                    style={{ borderRadius: "50%" }}
                  />
                  <Text size="sm">{t("In Progress")}</Text>
                </Group>
                <Text size="sm" fw={500}>
                  {allTasks.filter((t) => t.status === "in_progress").length}
                </Text>
              </Group>

              <Group justify="space-between">
                <Group>
                  <Box
                    w={16}
                    h={16}
                    bg={theme.colors.violet[5]}
                    style={{ borderRadius: "50%" }}
                  />
                  <Text size="sm">{t("In Review")}</Text>
                </Group>
                <Text size="sm" fw={500}>
                  {allTasks.filter((t) => t.status === "in_review").length}
                </Text>
              </Group>

              <Group justify="space-between">
                <Group>
                  <Box
                    w={16}
                    h={16}
                    bg={theme.colors.green[5]}
                    style={{ borderRadius: "50%" }}
                  />
                  <Text size="sm">{t("Done")}</Text>
                </Group>
                <Text size="sm" fw={500}>
                  {allTasks.filter((t) => t.status === "done").length}
                </Text>
              </Group>

              <Group justify="space-between">
                <Group>
                  <Box
                    w={16}
                    h={16}
                    bg={theme.colors.red[5]}
                    style={{ borderRadius: "50%" }}
                  />
                  <Text size="sm">{t("Blocked")}</Text>
                </Group>
                <Text size="sm" fw={500}>
                  {allTasks.filter((t) => t.status === "blocked").length}
                </Text>
              </Group>
            </Stack>

            <Divider my="md" />

            <Group justify="space-between">
              <Text size="sm" fw={500}>
                {t("Total")}
              </Text>
              <Text size="sm" fw={700}>
                {allTasks.length}
              </Text>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Upcoming deadlines */}
      <Paper withBorder p="md" radius="md">
        <Title order={3} size="h4" mb="md">
          {t("Upcoming Deadlines")}
        </Title>

        <Stack>
          {allTasks
            .filter((task) => task.dueDate && task.status !== "done")
            .sort(
              (a, b) =>
                new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
            )
            .slice(0, 5)
            .map((task) => {
              const dueDate = new Date(task.dueDate!);
              const now = new Date();
              const isOverdue = dueDate < now;
              const isDueSoon =
                !isOverdue &&
                dueDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000;

              // Find the project this task belongs to
              const project = projects.find((p) => p.id === task.projectId);

              return (
                <Card key={task.id} withBorder p="sm" radius="md">
                  <Group justify="space-between" wrap="nowrap">
                    <Box>
                      <Group>
                        <IconAlarm
                          size={16}
                          color={
                            isOverdue
                              ? theme.colors.red[6]
                              : isDueSoon
                                ? theme.colors.orange[6]
                                : theme.colors.gray[6]
                          }
                        />
                        <Text size="sm" fw={500}>
                          {task.title}
                        </Text>
                      </Group>

                      {project && (
                        <Text size="xs" c="dimmed" ml={20}>
                          {project.name}
                        </Text>
                      )}
                    </Box>

                    <Badge
                      color={isOverdue ? "red" : isDueSoon ? "orange" : "blue"}
                      variant="light"
                    >
                      {isOverdue
                        ? t("Overdue")
                        : isDueSoon
                          ? t("Due Soon")
                          : t("Upcoming")}
                    </Badge>
                  </Group>

                  <Group justify="space-between" mt="xs">
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

                    <Text size="xs">
                      {t("Due")}: {dueDate.toLocaleDateString()}
                    </Text>
                  </Group>
                </Card>
              );
            })}

          {allTasks.filter((task) => task.dueDate && task.status !== "done")
            .length === 0 && (
            <Text color="dimmed" size="sm" ta="center" py="md">
              {t("No upcoming deadlines")}
            </Text>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
