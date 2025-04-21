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
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableTask } from "./sortable-task";

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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const { data, isLoading, refetch } = useTasksByProject({
    projectId: project.id,
    includeSubtasks: true,
    searchTerm: searchTerm || undefined,
  });

  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Find the active task to show in drag overlay
    const taskId = active.id as string;
    const foundTask = data?.items.find((task) => task.id === taskId);
    if (foundTask) {
      setActiveTask(foundTask);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      setActiveTask(null);
      return;
    }

    // Extract the status from the over container ID
    // Format of container ID is "column-{status}"
    const containerId = over.id as string;

    if (containerId.startsWith("column-")) {
      const newStatus = containerId.replace("column-", "") as TaskStatus;
      const taskId = active.id as string;
      const task = data?.items.find((t) => t.id === taskId);

      if (task && task.status !== newStatus) {
        handleMoveTask(task, newStatus);
      }
    }

    setActiveId(null);
    setActiveTask(null);
  };

  const renderTaskCard = (task: Task) => (
    <SortableTask
      key={task.id}
      id={task.id}
      task={task}
      onEdit={() => handleOpenEditTaskModal(task)}
      onComplete={() => handleCompleteTask(task)}
      onDelete={() => handleDeleteTask(task)}
      onMove={(newStatus) => handleMoveTask(task, newStatus)}
    />
  );

  const renderColumn = (status: TaskStatus) => {
    const columnTasks =
      data?.items.filter((task) => task.status === status) || [];
    const columnInfo = statusColumnMap[status];
    const columnId = `column-${status}`;

    return (
      <Paper
        withBorder
        p="xs"
        radius="md"
        shadow="xs"
        w="300px"
        h="100%"
        style={{ display: "flex", flexDirection: "column" }}
        key={columnId}
        id={columnId}
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
          <SortableContext
            items={columnTasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
            id={columnId}
          >
            {columnTasks.map(renderTaskCard)}
          </SortableContext>

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <Flex gap="md" align="flex-start" style={{ width: "fit-content" }}>
              {columnOrder.map(renderColumn)}
            </Flex>

            <DragOverlay>
              {activeId && activeTask ? (
                <Card
                  shadow="xs"
                  mb="sm"
                  withBorder
                  p="sm"
                  style={{ width: "280px", opacity: 0.8 }}
                >
                  <Stack gap="xs">
                    <Group justify="space-between" mb={0}>
                      <ActionIcon
                        color={activeTask.status === "done" ? "green" : "gray"}
                        variant={
                          activeTask.status === "done" ? "filled" : "outline"
                        }
                        radius="xl"
                        size="sm"
                      >
                        {activeTask.status === "done" ? (
                          <IconCheck size={14} />
                        ) : (
                          <div style={{ width: 14, height: 14 }} />
                        )}
                      </ActionIcon>
                    </Group>

                    <Text fw={500} size="sm" lineClamp={2}>
                      {activeTask.title}
                    </Text>

                    {activeTask.description && (
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {activeTask.description}
                      </Text>
                    )}

                    {activeTask.priority && (
                      <Badge
                        size="xs"
                        color={
                          activeTask.priority === "urgent"
                            ? "red"
                            : activeTask.priority === "high"
                              ? "orange"
                              : activeTask.priority === "medium"
                                ? "blue"
                                : "gray"
                        }
                      >
                        {activeTask.priority}
                      </Badge>
                    )}
                  </Stack>
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>
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
