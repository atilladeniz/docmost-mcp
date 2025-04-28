import {
  Table,
  Group,
  Text,
  Badge,
  Avatar,
  Tooltip,
  ActionIcon,
  Menu,
  Box,
  Card,
} from "@mantine/core";
import {
  IconCalendar,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconTag,
  IconAlertCircle,
} from "@tabler/icons-react";
import { Task } from "../../../types";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/lib/utils/format-utils";

interface BoardListProps {
  tasks: Task[];
  users: any[];
  onEditTask: (task: Task) => void;
}

export function BoardList({ tasks, users, onEditTask }: BoardListProps) {
  const { t } = useTranslation();

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

  // Handle due date display
  const renderDueDate = (dueDate?: string) => {
    if (!dueDate) return null;

    const date = new Date(dueDate);
    const now = new Date();
    const isOverdue = date < now;

    return (
      <Group gap={5}>
        <IconCalendar size={14} color={isOverdue ? "red" : "gray"} />
        <Text size="sm" c={isOverdue ? "red" : "dimmed"}>
          {dueDate ? formatDate(new Date(dueDate)) : ""}
        </Text>
      </Group>
    );
  };

  // Render assignee
  const renderAssignee = (assigneeId?: string) => {
    if (!assigneeId)
      return (
        <Text size="sm" c="dimmed">
          —
        </Text>
      );

    const assignee = users.find((user) => user.id === assigneeId);
    if (!assignee)
      return (
        <Text size="sm" c="dimmed">
          —
        </Text>
      );

    return (
      <Group gap="xs">
        <Avatar
          src={assignee.avatarUrl}
          size="sm"
          radius="xl"
          alt={assignee.name}
        >
          {assignee.name?.charAt(0).toUpperCase()}
        </Avatar>
        <Text size="sm">{assignee.name}</Text>
      </Group>
    );
  };

  // Render priority
  const renderPriority = (priority?: string) => {
    if (!priority)
      return (
        <Text size="sm" c="dimmed">
          —
        </Text>
      );

    return (
      <Badge color={getPriorityColor(priority)} variant="light">
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  // Render labels
  const renderLabels = (labels?: any[]) => {
    if (!labels || labels.length === 0)
      return (
        <Text size="sm" c="dimmed">
          —
        </Text>
      );

    return (
      <Group gap={5}>
        {labels.slice(0, 2).map((label) => (
          <Badge
            key={label.id}
            color={label.color || "gray"}
            variant="dot"
            size="sm"
          >
            {label.name}
          </Badge>
        ))}
        {labels.length > 2 && (
          <Tooltip
            label={labels
              .slice(2)
              .map((l) => l.name)
              .join(", ")}
            position="top"
          >
            <Badge color="gray" variant="light" size="sm">
              +{labels.length - 2}
            </Badge>
          </Tooltip>
        )}
      </Group>
    );
  };

  // Render actions
  const renderActions = (task: Task) => (
    <Menu position="bottom-end" shadow="md">
      <Menu.Target>
        <ActionIcon variant="subtle" size="sm">
          <IconDotsVertical size={16} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconEdit size={16} />}
          onClick={() => onEditTask(task)}
        >
          {t("Edit")}
        </Menu.Item>
        <Menu.Item leftSection={<IconTrash size={16} />} color="red">
          {t("Delete")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );

  return (
    <Card withBorder p={0}>
      <Box style={{ overflowX: "auto" }}>
        <Table
          striped
          highlightOnHover
          horizontalSpacing="md"
          verticalSpacing="sm"
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("Title")}</Table.Th>
              <Table.Th>{t("Status")}</Table.Th>
              <Table.Th>{t("Priority")}</Table.Th>
              <Table.Th>{t("Assignee")}</Table.Th>
              <Table.Th>{t("Due Date")}</Table.Th>
              <Table.Th>{t("Labels")}</Table.Th>
              <Table.Th style={{ width: 40 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {tasks.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7} align="center" p="lg">
                  <Text c="dimmed" fz="sm">
                    {t("No tasks found")}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              tasks.map((task) => (
                <Table.Tr key={task.id}>
                  <Table.Td>
                    <Text
                      fw={500}
                      lineClamp={1}
                      style={{ cursor: "pointer" }}
                      onClick={() => onEditTask(task)}
                    >
                      {task.title}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(task.status)}>
                      {task.status.replace("_", " ")}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{renderPriority(task.priority)}</Table.Td>
                  <Table.Td>{renderAssignee(task.assigneeId)}</Table.Td>
                  <Table.Td>{renderDueDate(task.dueDate)}</Table.Td>
                  <Table.Td>{renderLabels(task.labels)}</Table.Td>
                  <Table.Td>{renderActions(task)}</Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Box>
    </Card>
  );
}
