import { Card, Stack, Text, Badge, Group, ActionIcon } from "@mantine/core";
import { Task } from "../types";
import { IconCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { CustomAvatar } from "@/components/ui/custom-avatar";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
  users?: any[];
}

export function TaskCard({
  task,
  onClick,
  isDragging = false,
  users = [],
}: TaskCardProps) {
  const { t } = useTranslation();

  const assignee = users.find((user) => user.id === task.assigneeId);

  return (
    <Card
      shadow="xs"
      mb="sm"
      withBorder
      p="sm"
      style={{
        width: "100%",
        opacity: isDragging ? 0.8 : 1,
        cursor: "pointer",
        backgroundColor: isDragging ? "#f1f3f5" : undefined,
      }}
      onClick={onClick}
    >
      <Stack gap="xs">
        <Group justify="space-between" mb={0}>
          <ActionIcon
            color={task.status === "done" ? "green" : "gray"}
            variant={task.status === "done" ? "filled" : "outline"}
            radius="xl"
            size="sm"
          >
            {task.status === "done" ? (
              <IconCheck size={14} />
            ) : (
              <div style={{ width: 14, height: 14 }} />
            )}
          </ActionIcon>
        </Group>

        <Text fw={500} size="sm" lineClamp={2}>
          {task.title}
        </Text>

        {task.description && (
          <Text size="xs" c="dimmed" lineClamp={2}>
            {task.description}
          </Text>
        )}

        <Group gap="xs" wrap="nowrap">
          {task.priority && (
            <Badge
              size="xs"
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
          )}

          {task.dueDate && (
            <Badge size="xs" color="cyan">
              {new Date(task.dueDate).toLocaleDateString()}
            </Badge>
          )}
        </Group>

        {assignee && (
          <Group justify="apart" mt="xs">
            <CustomAvatar
              avatarUrl={assignee.avatarUrl}
              size="xs"
              radius="xl"
              name={assignee.name}
            />
            <Text size="xs">{assignee.name}</Text>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
