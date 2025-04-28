import { useState, useEffect } from "react";
import {
  Box,
  Text,
  Group,
  Badge,
  Card,
  SimpleGrid,
  Avatar,
  Title,
  ScrollArea,
  Divider,
} from "@mantine/core";
import { Task } from "../../../types";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/lib/utils/format-utils";
import dayjs from "dayjs";

interface BoardTimelineProps {
  tasks: Task[];
  users: any[];
  onEditTask: (task: Task) => void;
}

interface TimelineGroup {
  label: string;
  date: Date | null;
  tasks: Task[];
}

export function BoardTimeline({
  tasks,
  users,
  onEditTask,
}: BoardTimelineProps) {
  const { t } = useTranslation();
  const [timelineGroups, setTimelineGroups] = useState<TimelineGroup[]>([]);

  // Map status to color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "gray";
      case "in_progress":
        return "blue";
      case "in_review":
        return "indigo";
      case "done":
        return "green";
      case "blocked":
        return "red";
      default:
        return "gray";
    }
  };

  // Map priority to color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "red";
      case "high":
        return "orange";
      case "medium":
        return "blue";
      case "low":
        return "gray";
      default:
        return "gray";
    }
  };

  // Group tasks by due date
  useEffect(() => {
    const today = dayjs().startOf("day");
    const tomorrow = dayjs().add(1, "day").startOf("day");
    const nextWeek = dayjs().add(7, "day").startOf("day");

    // Initialize groups
    const groups: TimelineGroup[] = [
      { label: t("Overdue"), date: null, tasks: [] },
      { label: t("Today"), date: today.toDate(), tasks: [] },
      { label: t("Tomorrow"), date: tomorrow.toDate(), tasks: [] },
      { label: t("Next 7 Days"), date: nextWeek.toDate(), tasks: [] },
      { label: t("Later"), date: null, tasks: [] },
      { label: t("No Due Date"), date: null, tasks: [] },
    ];

    // Sort tasks into groups
    tasks.forEach((task) => {
      if (!task.dueDate) {
        groups[5].tasks.push(task);
        return;
      }

      const dueDate = dayjs(task.dueDate);

      if (dueDate.isBefore(today, "day")) {
        groups[0].tasks.push(task);
      } else if (dueDate.isSame(today, "day")) {
        groups[1].tasks.push(task);
      } else if (dueDate.isSame(tomorrow, "day")) {
        groups[2].tasks.push(task);
      } else if (dueDate.isBefore(nextWeek, "day")) {
        groups[3].tasks.push(task);
      } else {
        groups[4].tasks.push(task);
      }
    });

    // Filter out empty groups
    const filteredGroups = groups.filter((group) => group.tasks.length > 0);

    setTimelineGroups(filteredGroups);
  }, [tasks, t]);

  // Render assignee
  const renderAssignee = (assigneeId?: string) => {
    if (!assigneeId) return null;

    const assignee = users.find((user) => user.id === assigneeId);
    if (!assignee) return null;

    return (
      <Avatar
        src={assignee.avatarUrl}
        size="sm"
        radius="xl"
        alt={assignee.name}
        title={assignee.name}
      >
        {assignee.name?.charAt(0).toUpperCase()}
      </Avatar>
    );
  };

  // Render task card
  const renderTaskCard = (task: Task) => (
    <Card
      key={task.id}
      withBorder
      p="sm"
      radius="md"
      shadow="sm"
      mb="xs"
      style={{ cursor: "pointer" }}
      onClick={() => onEditTask(task)}
    >
      <Group justify="space-between" mb="xs">
        <Badge color={getStatusColor(task.status)}>
          {task.status.replace("_", " ")}
        </Badge>
        {task.priority && (
          <Badge
            color={getPriorityColor(task.priority)}
            variant="light"
            size="sm"
          >
            {task.priority}
          </Badge>
        )}
      </Group>

      <Text fw={500} lineClamp={2} mb="xs">
        {task.title}
      </Text>

      {task.description && (
        <Text size="sm" lineClamp={2} c="dimmed" mb="xs">
          {task.description}
        </Text>
      )}

      <Group justify="space-between" mt="md">
        {renderAssignee(task.assigneeId)}

        {task.dueDate && (
          <Text size="xs" c="dimmed">
            {task.dueDate ? formatDate(new Date(task.dueDate)) : ""}
          </Text>
        )}
      </Group>
    </Card>
  );

  // Render timeline group
  const renderTimelineGroup = (group: TimelineGroup, index: number) => (
    <Box key={index} mb="md">
      <Group justify="space-between" mb="sm">
        <Title order={4}>{group.label}</Title>
        <Badge variant="light" size="lg">
          {group.tasks.length} {t("tasks")}
        </Badge>
      </Group>

      <ScrollArea>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
          {group.tasks.map(renderTaskCard)}
        </SimpleGrid>
      </ScrollArea>

      {index < timelineGroups.length - 1 && <Divider my="md" />}
    </Box>
  );

  return (
    <Box>
      {timelineGroups.length === 0 ? (
        <Card withBorder p="xl" ta="center">
          <Text c="dimmed" fz="md">
            {t("No tasks with due dates found")}
          </Text>
        </Card>
      ) : (
        timelineGroups.map(renderTimelineGroup)
      )}
    </Box>
  );
}
