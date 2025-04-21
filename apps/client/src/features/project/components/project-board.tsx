import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Group,
  Text,
  Title,
  Stack,
  Badge,
  Menu,
  ActionIcon,
  Tooltip,
  TextInput,
  Loader,
  Flex,
  Box,
  UnstyledButton,
  ScrollArea,
  Paper,
} from "@mantine/core";
import {
  IconPlus,
  IconDotsVertical,
  IconCheck,
  IconArrowAutofitRight,
  IconTrash,
  IconEdit,
  IconArrowRight,
  IconSearch,
  IconFilter,
  IconX,
} from "@tabler/icons-react";
import { Project, Task, TaskStatus } from "../types";
import {
  useTasksByProject,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "../hooks/use-tasks";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { useTranslation } from "react-i18next";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import TaskFormModal from "./task-form-modal";

// Map of status to column title
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

interface ProjectBoardProps {
  project: Project;
  onBack: () => void;
}

export function ProjectBoard({ project, onBack }: ProjectBoardProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [taskModalOpened, { open: openTaskModal, close: closeTaskModal }] =
    useDisclosure(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { data, isLoading, refetch } = useTasksByProject({
    projectId: project.id,
    includeSubtasks: true,
    searchTerm: searchTerm || undefined,
  });

  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();

  useEffect(() => {
    refetch();
  }, [project.id, refetch]);

  const handleOpenCreateTaskModal = () => {
    setEditingTask(null);
    openTaskModal();
  };

  const handleOpenEditTaskModal = (task: Task) => {
    setEditingTask(task);
    openTaskModal();
  };

  const handleCloseTaskModal = () => {
    closeTaskModal();
    setEditingTask(null);
  };

  const handleMoveTask = (task: Task, newStatus: TaskStatus) => {
    updateTaskMutation.mutate({
      taskId: task.id,
      status: newStatus,
    });
  };

  const handleCompleteTask = (task: Task) => {
    updateTaskMutation.mutate({
      taskId: task.id,
      status: task.status === "done" ? "todo" : "done",
    });
  };

  const handleDeleteTask = (task: Task) => {
    modals.openConfirmModal({
      title: t("Delete task"),
      children: (
        <Text size="sm">
          {t('Are you sure you want to delete task "{title}"?', {
            title: task.title,
          })}
        </Text>
      ),
      labels: { confirm: t("Delete"), cancel: t("Cancel") },
      confirmProps: { color: "red" },
      onConfirm: () => deleteTaskMutation.mutate(task.id),
    });
  };

  const renderTaskCard = (task: Task) => (
    <Card key={task.id} shadow="xs" mb="sm" withBorder p="sm">
      <Stack gap="xs">
        <Group justify="space-between" mb={0}>
          <UnstyledButton onClick={() => handleCompleteTask(task)}>
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
              <ActionIcon size="sm">
                <IconDotsVertical size={14} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEdit size={14} />}
                onClick={() => handleOpenEditTaskModal(task)}
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
                    onClick={() => handleMoveTask(task, status)}
                  >
                    {statusColumnMap[status].title}
                  </Menu.Item>
                ))}

              <Menu.Divider />

              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => handleDeleteTask(task)}
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
            <CustomAvatar user={task.assignee} size="sm" showTooltip />
          </Group>
        )}
      </Stack>
    </Card>
  );

  const renderColumn = (status: TaskStatus) => {
    const columnTasks =
      data?.items.filter((task) => task.status === status) || [];
    const columnInfo = statusColumnMap[status];

    return (
      <Paper
        withBorder
        p="xs"
        radius="md"
        shadow="xs"
        w="300px"
        h="100%"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <Group justify="space-between" mb="sm">
          <Badge color={columnInfo.color} size="lg" variant="filled">
            {columnInfo.title} ({columnTasks.length})
          </Badge>

          <Tooltip label={t("Add task to this column")}>
            <ActionIcon
              variant="light"
              onClick={() => {
                setEditingTask({ status } as Task);
                openTaskModal();
              }}
              color={columnInfo.color}
            >
              <IconPlus size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <ScrollArea h="calc(100vh - 250px)" style={{ flex: 1 }}>
          {columnTasks.map((task) => renderTaskCard(task))}

          {columnTasks.length === 0 && (
            <Box py="md">
              <Text ta="center" c="dimmed" size="sm">
                {t("No tasks")}
              </Text>
            </Box>
          )}
        </ScrollArea>
      </Paper>
    );
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Loader />
      </Flex>
    );
  }

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <UnstyledButton onClick={onBack}>
              <ActionIcon variant="subtle" color="gray">
                <IconArrowAutofitRight
                  size={18}
                  style={{ transform: "rotate(180deg)" }}
                />
              </ActionIcon>
            </UnstyledButton>
            <Title order={3}>
              {project.icon && (
                <span style={{ marginRight: 8 }}>{project.icon}</span>
              )}
              {project.name}
            </Title>
            {project.isArchived && <Badge color="gray">{t("Archived")}</Badge>}
          </Group>

          <Group>
            <TextInput
              placeholder={t("Search tasks...")}
              leftSection={<IconSearch size={16} />}
              rightSection={
                searchTerm ? (
                  <ActionIcon size="sm" onClick={() => setSearchTerm("")}>
                    <IconX size={14} />
                  </ActionIcon>
                ) : undefined
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              size="sm"
              w="200px"
            />
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleOpenCreateTaskModal}
            >
              {t("New Task")}
            </Button>
          </Group>
        </Group>

        <ScrollArea h="calc(100vh - 150px)" type="auto" offsetScrollbars>
          <Flex gap="md" align="flex-start" style={{ width: "fit-content" }}>
            {columnOrder.map((status) => renderColumn(status))}
          </Flex>
        </ScrollArea>
      </Stack>

      {/* Task Create/Edit Modal */}
      {taskModalOpened && (
        <TaskFormModal
          opened={taskModalOpened}
          onClose={handleCloseTaskModal}
          projectId={project.id}
          spaceId={project.spaceId}
          task={editingTask}
        />
      )}
    </>
  );
}
