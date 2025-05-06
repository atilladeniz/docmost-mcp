import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Group,
  Paper,
  Text,
  Stack,
  Title,
  Loader,
  ScrollArea,
  Badge,
  useMantineTheme,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useTasksByProject, useUpdateTaskMutation } from "../hooks/use-tasks";
import { TaskCard } from "./task-card";
import { Task, TaskStatus } from "../types";
import { IconPlus } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import TaskFormModal from "./task-form-modal";

interface TaskKanbanProps {
  projectId: string;
  spaceId: string;
  onTaskClick: (taskId: string) => void;
}

// Define the columns for the kanban board
const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "in_review", label: "In Review" },
  { id: "done", label: "Done" },
  { id: "blocked", label: "Blocked" },
];

export function TaskKanban({
  projectId,
  spaceId,
  onTaskClick,
}: TaskKanbanProps) {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const [opened, { open, close }] = useDisclosure(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Fetch tasks for the project
  const {
    data: taskData,
    isLoading,
    refetch,
  } = useTasksByProject({
    projectId,
  });

  // Update task mutation
  const updateTaskMutation = useUpdateTaskMutation();

  // Refetch tasks when mutations complete
  useEffect(() => {
    if (updateTaskMutation.isSuccess) {
      refetch();
    }
  }, [updateTaskMutation.isSuccess, refetch]);

  // Group tasks by status
  const getTasksByStatus = (status: TaskStatus) => {
    if (!taskData || !taskData.items) return [];
    return taskData.items.filter((task) => task.status === status);
  };

  // Handle drag start
  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Handle drop
  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetStatus: TaskStatus
  ) => {
    e.preventDefault();

    if (draggedTask && draggedTask.status !== targetStatus) {
      updateTaskMutation.mutate({
        taskId: draggedTask.id,
        status: targetStatus,
      });
    }

    setDraggedTask(null);
  };

  // Get color for column
  const getColumnColor = (status: TaskStatus) => {
    switch (status) {
      case "todo":
        return theme.colors.blue[0];
      case "in_progress":
        return theme.colors.yellow[0];
      case "in_review":
        return theme.colors.violet[0];
      case "done":
        return theme.colors.teal[0];
      case "blocked":
        return theme.colors.red[0];
      default:
        return theme.colors.gray[0];
    }
  };

  // Get badge color for column
  const getBadgeColor = (status: TaskStatus) => {
    switch (status) {
      case "todo":
        return "blue";
      case "in_progress":
        return "yellow";
      case "in_review":
        return "violet";
      case "done":
        return "teal";
      case "blocked":
        return "red";
      default:
        return "gray";
    }
  };

  if (isLoading) {
    return (
      <Box
        style={{ display: "flex", justifyContent: "center", padding: "2rem" }}
      >
        <Loader />
      </Box>
    );
  }

  return (
    <Box>
      <Group justify="flex-end" mb="md">
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          {t("New Task")}
        </Button>
      </Group>

      <ScrollArea h={600} type="auto" offsetScrollbars>
        <Group align="start" style={{ minWidth: COLUMNS.length * 280 }}>
          {COLUMNS.map((column) => {
            const columnTasks = getTasksByStatus(column.id);

            return (
              <Paper
                key={column.id}
                shadow="xs"
                p="md"
                w={280}
                h="100%"
                withBorder
                style={{
                  backgroundColor: getColumnColor(column.id),
                  transition: "background-color 0.2s",
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <Stack gap="md">
                  <Group justify="space-between">
                    <Title order={5}>{t(column.label)}</Title>
                    <Badge variant="light" color={getBadgeColor(column.id)}>
                      {columnTasks.length}
                    </Badge>
                  </Group>

                  {columnTasks.length === 0 ? (
                    <Box
                      style={{
                        textAlign: "center",
                        padding: "1rem",
                        border: "1px dashed var(--mantine-color-gray-4)",
                        borderRadius: "var(--mantine-radius-sm)",
                        backgroundColor: "rgba(255, 255, 255, 0.5)",
                      }}
                    >
                      <Text size="sm" c="dimmed">
                        {t("Drop tasks here")}
                      </Text>
                    </Box>
                  ) : (
                    <Stack gap="md">
                      {columnTasks.map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                        >
                          <TaskCard
                            task={task}
                            onClick={() => onTaskClick(task.id)}
                            isDragging={draggedTask?.id === task.id}
                          />
                        </div>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Group>
      </ScrollArea>

      <TaskFormModal
        opened={opened}
        onClose={close}
        projectId={projectId}
        spaceId={spaceId}
        task={null}
      />
    </Box>
  );
}
