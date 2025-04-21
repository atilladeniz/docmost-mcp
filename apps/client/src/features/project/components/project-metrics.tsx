import React, { useMemo } from "react";
import {
  Card,
  Group,
  RingProgress,
  Text,
  SimpleGrid,
  Paper,
  Stack,
  Badge,
  Progress,
  Title,
  Box,
  Flex,
  List,
  ThemeIcon,
  useMantineTheme,
} from "@mantine/core";
import {
  IconCalendarDue,
  IconCalendarStats,
  IconChecklist,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconExclamationCircle,
  IconHourglass,
  IconUserCircle,
} from "@tabler/icons-react";
import { Task, TaskPriority, TaskStatus } from "../types";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { CustomAvatar } from "@/components/ui/custom-avatar";

interface ProjectMetricsProps {
  tasks: Task[];
  users: any[];
}

export function ProjectMetrics({ tasks, users }: ProjectMetricsProps) {
  const { t } = useTranslation();
  const theme = useMantineTheme();

  const metrics = useMemo(() => {
    // Basic task counts
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => task.status === "done"
    ).length;
    const inProgressTasks = tasks.filter(
      (task) => task.status === "in_progress"
    ).length;
    const blockedTasks = tasks.filter(
      (task) => task.status === "blocked"
    ).length;
    const reviewTasks = tasks.filter(
      (task) => task.status === "in_review"
    ).length;
    const todoTasks = tasks.filter((task) => task.status === "todo").length;

    // Completion percentage
    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Priority breakdown
    const urgentTasks = tasks.filter(
      (task) => task.priority === "urgent"
    ).length;
    const highTasks = tasks.filter((task) => task.priority === "high").length;
    const mediumTasks = tasks.filter(
      (task) => task.priority === "medium"
    ).length;
    const lowTasks = tasks.filter((task) => task.priority === "low").length;

    // Task distribution by assignee
    const tasksByAssignee = tasks.reduce(
      (acc, task) => {
        const assigneeId = task.assigneeId || "unassigned";
        if (!acc[assigneeId]) {
          acc[assigneeId] = {
            count: 0,
            completed: 0,
            user: users.find((u) => u.id === assigneeId) || null,
          };
        }
        acc[assigneeId].count++;
        if (task.status === "done") {
          acc[assigneeId].completed++;
        }
        return acc;
      },
      {} as Record<string, { count: number; completed: number; user: any }>
    );

    // Sort assignees by task count
    const sortedAssignees = Object.entries(tasksByAssignee)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5); // Top 5 assignees

    // Date metrics
    const today = dayjs();
    const overdueTasks = tasks.filter(
      (task) =>
        task.dueDate &&
        dayjs(task.dueDate).isBefore(today, "day") &&
        task.status !== "done"
    );

    const upcomingTasks = tasks.filter(
      (task) =>
        task.dueDate &&
        dayjs(task.dueDate).isAfter(today, "day") &&
        dayjs(task.dueDate).isBefore(today.add(7, "day"), "day") &&
        task.status !== "done"
    );

    // Tasks with no due date
    const noDueDateTasks = tasks.filter((task) => !task.dueDate).length;

    // Tasks created in the last 30 days
    const last30Days = today.subtract(30, "day");
    const recentlyCreatedTasks = tasks.filter((task) =>
      dayjs(task.createdAt).isAfter(last30Days)
    ).length;

    // Recently completed tasks (last 7 days)
    const last7Days = today.subtract(7, "day");
    const recentlyCompletedTasks = tasks.filter(
      (task) =>
        task.status === "done" &&
        task.completedAt &&
        dayjs(task.completedAt).isAfter(last7Days)
    ).length;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      reviewTasks,
      todoTasks,
      completionPercentage,
      urgentTasks,
      highTasks,
      mediumTasks,
      lowTasks,
      tasksByAssignee: sortedAssignees,
      overdueTasks,
      upcomingTasks,
      noDueDateTasks,
      recentlyCreatedTasks,
      recentlyCompletedTasks,
    };
  }, [tasks, users]);

  const statusColors = {
    todo: "gray",
    in_progress: "blue",
    in_review: "indigo",
    done: "green",
    blocked: "red",
  };

  const priorityColors = {
    urgent: "red",
    high: "orange",
    medium: "blue",
    low: "gray",
  };

  return (
    <Stack>
      <Title order={3} mb="md">
        {t("Project Overview")}
      </Title>

      {/* Main metrics */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between">
            <Text size="lg" fw={500}>
              {t("Task Status")}
            </Text>
            <IconChecklist size={22} />
          </Group>
          <Group justify="space-between" mt="md">
            <Stack gap={0}>
              <Text size="xl" fw={700}>
                {metrics.totalTasks}
              </Text>
              <Text size="sm" c="dimmed">
                {t("Total Tasks")}
              </Text>
            </Stack>
            <RingProgress
              size={80}
              roundCaps
              thickness={8}
              sections={[
                {
                  value:
                    (metrics.todoTasks / Math.max(metrics.totalTasks, 1)) * 100,
                  color: statusColors.todo,
                },
                {
                  value:
                    (metrics.inProgressTasks /
                      Math.max(metrics.totalTasks, 1)) *
                    100,
                  color: statusColors.in_progress,
                },
                {
                  value:
                    (metrics.reviewTasks / Math.max(metrics.totalTasks, 1)) *
                    100,
                  color: statusColors.in_review,
                },
                {
                  value:
                    (metrics.completedTasks / Math.max(metrics.totalTasks, 1)) *
                    100,
                  color: statusColors.done,
                },
                {
                  value:
                    (metrics.blockedTasks / Math.max(metrics.totalTasks, 1)) *
                    100,
                  color: statusColors.blocked,
                },
              ]}
              label={
                <Text size="xs" ta="center" fw={700}>
                  {`${metrics.completionPercentage}%`}
                </Text>
              }
            />
          </Group>
          <Stack mt="md" gap="xs">
            <Group justify="space-between">
              <Group gap="xs">
                <Box
                  w={12}
                  h={12}
                  bg={statusColors.todo}
                  style={{ borderRadius: "50%" }}
                />
                <Text size="xs">{t("To Do")}</Text>
              </Group>
              <Text size="xs">{metrics.todoTasks}</Text>
            </Group>
            <Group justify="space-between">
              <Group gap="xs">
                <Box
                  w={12}
                  h={12}
                  bg={statusColors.in_progress}
                  style={{ borderRadius: "50%" }}
                />
                <Text size="xs">{t("In Progress")}</Text>
              </Group>
              <Text size="xs">{metrics.inProgressTasks}</Text>
            </Group>
            <Group justify="space-between">
              <Group gap="xs">
                <Box
                  w={12}
                  h={12}
                  bg={statusColors.in_review}
                  style={{ borderRadius: "50%" }}
                />
                <Text size="xs">{t("In Review")}</Text>
              </Group>
              <Text size="xs">{metrics.reviewTasks}</Text>
            </Group>
            <Group justify="space-between">
              <Group gap="xs">
                <Box
                  w={12}
                  h={12}
                  bg={statusColors.done}
                  style={{ borderRadius: "50%" }}
                />
                <Text size="xs">{t("Done")}</Text>
              </Group>
              <Text size="xs">{metrics.completedTasks}</Text>
            </Group>
            <Group justify="space-between">
              <Group gap="xs">
                <Box
                  w={12}
                  h={12}
                  bg={statusColors.blocked}
                  style={{ borderRadius: "50%" }}
                />
                <Text size="xs">{t("Blocked")}</Text>
              </Group>
              <Text size="xs">{metrics.blockedTasks}</Text>
            </Group>
          </Stack>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between">
            <Text size="lg" fw={500}>
              {t("Priority Breakdown")}
            </Text>
            <IconExclamationCircle size={22} />
          </Group>
          <Stack mt="md" gap="xs">
            <Group justify="space-between">
              <Text size="sm">{t("Urgent")}</Text>
              <Badge color={priorityColors.urgent}>{metrics.urgentTasks}</Badge>
            </Group>
            <Progress
              value={
                (metrics.urgentTasks / Math.max(metrics.totalTasks, 1)) * 100
              }
              color={priorityColors.urgent}
              size="sm"
            />

            <Group justify="space-between" mt="xs">
              <Text size="sm">{t("High")}</Text>
              <Badge color={priorityColors.high}>{metrics.highTasks}</Badge>
            </Group>
            <Progress
              value={
                (metrics.highTasks / Math.max(metrics.totalTasks, 1)) * 100
              }
              color={priorityColors.high}
              size="sm"
            />

            <Group justify="space-between" mt="xs">
              <Text size="sm">{t("Medium")}</Text>
              <Badge color={priorityColors.medium}>{metrics.mediumTasks}</Badge>
            </Group>
            <Progress
              value={
                (metrics.mediumTasks / Math.max(metrics.totalTasks, 1)) * 100
              }
              color={priorityColors.medium}
              size="sm"
            />

            <Group justify="space-between" mt="xs">
              <Text size="sm">{t("Low")}</Text>
              <Badge color={priorityColors.low}>{metrics.lowTasks}</Badge>
            </Group>
            <Progress
              value={(metrics.lowTasks / Math.max(metrics.totalTasks, 1)) * 100}
              color={priorityColors.low}
              size="sm"
            />
          </Stack>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between">
            <Text size="lg" fw={500}>
              {t("Deadlines")}
            </Text>
            <IconCalendarDue size={22} />
          </Group>

          <Stack mt="md">
            <Group justify="space-between">
              <Group>
                <ThemeIcon color="red" variant="light">
                  <IconCircleX size={18} />
                </ThemeIcon>
                <div>
                  <Text>{t("Overdue")}</Text>
                  <Text size="xs" c="dimmed">
                    {t("Needs immediate attention")}
                  </Text>
                </div>
              </Group>
              <Badge color="red" size="lg">
                {metrics.overdueTasks.length}
              </Badge>
            </Group>

            <Group justify="space-between" mt="sm">
              <Group>
                <ThemeIcon color="yellow" variant="light">
                  <IconClock size={18} />
                </ThemeIcon>
                <div>
                  <Text>{t("Due Soon")}</Text>
                  <Text size="xs" c="dimmed">
                    {t("Next 7 days")}
                  </Text>
                </div>
              </Group>
              <Badge color="yellow" size="lg">
                {metrics.upcomingTasks.length}
              </Badge>
            </Group>

            <Group justify="space-between" mt="sm">
              <Group>
                <ThemeIcon color="gray" variant="light">
                  <IconHourglass size={18} />
                </ThemeIcon>
                <div>
                  <Text>{t("No Due Date")}</Text>
                  <Text size="xs" c="dimmed">
                    {t("Not scheduled")}
                  </Text>
                </div>
              </Group>
              <Badge color="gray" size="lg">
                {metrics.noDueDateTasks}
              </Badge>
            </Group>
          </Stack>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between">
            <Text size="lg" fw={500}>
              {t("Activity")}
            </Text>
            <IconCalendarStats size={22} />
          </Group>

          <Stack mt="md" gap="md">
            <Group justify="space-between">
              <Text>{t("Completion Rate")}</Text>
              <Text fw={700} size="xl">
                {metrics.completionPercentage}%
              </Text>
            </Group>

            <div>
              <Text>{t("Recently Completed")}</Text>
              <Group justify="space-between" mt={4}>
                <Text size="sm" c="dimmed">
                  {t("Last 7 days")}
                </Text>
                <Badge color="green">{metrics.recentlyCompletedTasks}</Badge>
              </Group>
            </div>

            <div>
              <Text>{t("Recently Created")}</Text>
              <Group justify="space-between" mt={4}>
                <Text size="sm" c="dimmed">
                  {t("Last 30 days")}
                </Text>
                <Badge color="blue">{metrics.recentlyCreatedTasks}</Badge>
              </Group>
            </div>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Assignee distribution */}
      <SimpleGrid cols={{ base: 1, md: 2 }} mt="md">
        <Card withBorder padding="lg" radius="md">
          <Text size="lg" fw={500} mb="md">
            {t("Top Assignees")}
          </Text>

          {metrics.tasksByAssignee.length > 0 ? (
            <Stack gap="sm">
              {metrics.tasksByAssignee.map(([assigneeId, data]) => (
                <Paper key={assigneeId} p="xs" withBorder>
                  <Group justify="space-between">
                    <Group>
                      {assigneeId === "unassigned" ? (
                        <ThemeIcon radius="xl" size="lg" variant="light">
                          <IconUserCircle size={24} />
                        </ThemeIcon>
                      ) : (
                        <CustomAvatar
                          size="md"
                          avatarUrl={data.user?.avatarUrl || ""}
                          name={data.user?.name || t("Unknown User")}
                        />
                      )}
                      <div>
                        <Text>
                          {assigneeId === "unassigned"
                            ? t("Unassigned")
                            : data.user?.name || t("Unknown User")}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {t("{count} tasks, {completed} completed", {
                            count: data.count,
                            completed: data.completed,
                          })}
                        </Text>
                      </div>
                    </Group>
                    <Group>
                      <RingProgress
                        size={46}
                        thickness={4}
                        roundCaps
                        sections={[
                          {
                            value: (data.completed / data.count) * 100,
                            color: "green",
                          },
                        ]}
                        label={
                          <Text ta="center" size="xs" fw={700}>
                            {Math.round((data.completed / data.count) * 100)}%
                          </Text>
                        }
                      />
                    </Group>
                  </Group>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Text c="dimmed" ta="center" py="xl">
              {t("No task assignments yet")}
            </Text>
          )}
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Text size="lg" fw={500} mb="md">
            {t("Overdue Tasks")}
          </Text>

          {metrics.overdueTasks.length > 0 ? (
            <List
              spacing="sm"
              center
              icon={
                <ThemeIcon color="red" size={22} radius="xl">
                  <IconCircleX size={16} />
                </ThemeIcon>
              }
            >
              {metrics.overdueTasks.slice(0, 8).map((task) => (
                <List.Item key={task.id}>
                  <Group justify="space-between">
                    <Text size="sm">{task.title}</Text>
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">
                        {t("Due")} {dayjs(task.dueDate).format("MMM D")}
                      </Text>
                      <Badge size="sm" color={priorityColors[task.priority]}>
                        {task.priority.charAt(0).toUpperCase() +
                          task.priority.slice(1)}
                      </Badge>
                    </Group>
                  </Group>
                </List.Item>
              ))}
              {metrics.overdueTasks.length > 8 && (
                <Text size="sm" c="dimmed" ta="center" mt="xs">
                  {t("And {count} more...", {
                    count: metrics.overdueTasks.length - 8,
                  })}
                </Text>
              )}
            </List>
          ) : (
            <Flex align="center" justify="center" direction="column" py="xl">
              <ThemeIcon size="xl" radius="xl" color="green" variant="light">
                <IconCircleCheck size={30} />
              </ThemeIcon>
              <Text mt="md" ta="center">
                {t("No overdue tasks!")}
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                {t("Everything is on track")}
              </Text>
            </Flex>
          )}
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
