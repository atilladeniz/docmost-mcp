import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ActionIcon,
  Badge,
  Card,
  Group,
  Menu,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import {
  IconArrowRight,
  IconCheck,
  IconDotsVertical,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { Task, TaskStatus } from "../types";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import { useTranslation } from "react-i18next";

// Map of status to column title (duplicated from project-board for component independence)
const statusColumnMap: Record<TaskStatus, { title: string; color: string }> = {
  todo: { title: "To Do", color: "gray" },
  in_progress: { title: "In Progress", color: "blue" },
  in_review: { title: "In Review", color: "indigo" },
  done: { title: "Done", color: "green" },
  blocked: { title: "Blocked", color: "red" },
};

// Order of columns in the board
const columnOrder: TaskStatus[] = [
  "todo",
  "in_progress",
  "in_review",
  "done",
  "blocked",
];

interface SortableTaskProps {
  id: string;
  task: Task;
  onEdit: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onMove: (status: TaskStatus) => void;
}

export function SortableTask({
  id,
  task,
  onEdit,
  onComplete,
  onDelete,
  onMove,
}: SortableTaskProps) {
  const { t } = useTranslation();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <Card
      ref={setNodeRef}
      shadow="xs"
      mb="sm"
      withBorder
      p="sm"
      style={style}
      {...attributes}
      {...listeners}
    >
      <Stack gap="xs">
        <Group justify="space-between" mb={0}>
          <UnstyledButton onClick={onComplete}>
            <Tooltip
              label={
                task.status === "done"
                  ? t("Mark as incomplete")
                  : t("Mark as complete")
              }
            >
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
            </Tooltip>
          </UnstyledButton>

          <Menu position="bottom-end" shadow="md">
            <Menu.Target>
              <ActionIcon size="sm" onClick={(e) => e.stopPropagation()}>
                <IconDotsVertical size={14} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
              <Menu.Item
                leftSection={<IconEdit size={14} />}
                onClick={() => onEdit()}
              >
                {t("Edit")}
              </Menu.Item>

              <Menu.Divider />

              <Menu.Label>{t("Move to")}</Menu.Label>
              {columnOrder
                .filter((status) => status !== task.status)
                .map((status) => (
                  <Menu.Item
                    key={status}
                    leftSection={<IconArrowRight size={14} />}
                    onClick={() => onMove(status)}
                  >
                    {statusColumnMap[status].title}
                  </Menu.Item>
                ))}

              <Menu.Divider />

              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => onDelete()}
              >
                {t("Delete")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Text fw={500} size="sm" lineClamp={2}>
          {task.title}
        </Text>

        {task.description && (
          <Text size="xs" c="dimmed" lineClamp={3}>
            {task.description}
          </Text>
        )}

        <Group gap="xs">
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
            <Badge size="xs" color="gray">
              {new Date(task.dueDate).toLocaleDateString()}
            </Badge>
          )}
        </Group>

        {task.assignee && (
          <Group justify="flex-end">
            <CustomAvatar
              avatarUrl={task.assignee.avatarUrl}
              name={task.assignee.name || task.assignee.email}
              size="sm"
            />
          </Group>
        )}
      </Stack>
    </Card>
  );
}
