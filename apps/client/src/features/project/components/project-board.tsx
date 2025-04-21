import { useState, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  Group,
  Text,
  Title,
  Stack,
  Paper,
  Flex,
  Badge,
  ActionIcon,
  Menu,
  Loader,
  SegmentedControl,
  MultiSelect,
  Select,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconPlus,
  IconFilter,
  IconLayoutColumns,
  IconLayoutRows,
} from "@tabler/icons-react";
import { useTasksByProject } from "../hooks/use-tasks";
import { Project, Task, TaskPriority, TaskStatus } from "../types";
import { TaskCard } from "./task-card";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDisclosure } from "@mantine/hooks";
import TaskFormModal from "./task-form-modal";
import { useUpdateTaskMutation } from "../hooks/use-tasks";
import { useTranslation } from "react-i18next";
import { SortableTask } from "./sortable-task";
import { useWorkspaceUsers } from "@/features/user/hooks/use-workspace-users";

interface ProjectBoardProps {
  project: Project;
  onBack: () => void;
}

type ViewMode = "kanban" | "swimlane";
type GroupBy = "status" | "assignee" | "priority";

export function ProjectBoard({ project, onBack }: ProjectBoardProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [groupBy, setGroupBy] = useState<GroupBy>("status");
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<Task | null>(null);

  const [isFormOpen, { open: openForm, close: closeForm }] =
    useDisclosure(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const updateTaskMutation = useUpdateTaskMutation();

  const { data: tasksData, isLoading: isTasksLoading } = useTasksByProject({
    projectId: project.id,
  });

  const { data: usersData } = useWorkspaceUsers({
    workspaceId: project.workspaceId,
  });

  const users = usersData?.items || [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const tasks = useMemo(() => {
    if (!tasksData) return [];
    let filtered = [...tasksData.items];

    // Apply filters
    if (statusFilter.length > 0) {
      filtered = filtered.filter((task) => statusFilter.includes(task.status));
    }

    if (priorityFilter.length > 0) {
      filtered = filtered.filter(
        (task) => task.priority && priorityFilter.includes(task.priority)
      );
    }

    if (assigneeFilter.length > 0) {
      filtered = filtered.filter(
        (task) => task.assigneeId && assigneeFilter.includes(task.assigneeId)
      );
    }

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(lowerSearchTerm) ||
          (task.description &&
            task.description.toLowerCase().includes(lowerSearchTerm))
      );
    }

    return filtered;
  }, [tasksData, statusFilter, priorityFilter, assigneeFilter, searchTerm]);

  const statusGroups = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
      blocked: [],
    };

    tasks.forEach((task) => {
      groups[task.status].push(task);
    });

    return groups;
  }, [tasks]);

  const priorityGroups = useMemo(() => {
    const groups: Record<TaskPriority, Task[]> = {
      low: [],
      medium: [],
      high: [],
      urgent: [],
    };

    tasks.forEach((task) => {
      if (task.priority) {
        groups[task.priority].push(task);
      } else {
        groups.medium.push(task);
      }
    });

    return groups;
  }, [tasks]);

  const assigneeGroups = useMemo(() => {
    const groups: Record<string, Task[]> = { unassigned: [] };

    tasks.forEach((task) => {
      if (!task.assigneeId) {
        groups.unassigned.push(task);
      } else {
        if (!groups[task.assigneeId]) {
          groups[task.assigneeId] = [];
        }
        groups[task.assigneeId].push(task);
      }
    });

    return groups;
  }, [tasks]);

  const getAssigneeName = useCallback(
    (assigneeId: string | null) => {
      if (!assigneeId) return t("Unassigned");
      const user = users.find((u) => u.id === assigneeId);
      return user ? user.name : t("Unknown User");
    },
    [users, t]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const draggedTask = tasks.find((task) => task.id === active.id);
    if (draggedTask) {
      setActiveDragData(draggedTask);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Optional: Add visual indicators for valid drop targets
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveDragData(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Handle drops into status containers
    if (overId.startsWith("status-")) {
      const newStatus = overId.replace("status-", "") as TaskStatus;
      const task = tasks.find((t) => t.id === activeId);
      if (task && task.status !== newStatus) {
        updateTaskMutation.mutate({
          taskId: task.id,
          status: newStatus,
        });
      }
    }
    // Handle drops into priority containers
    else if (overId.startsWith("priority-")) {
      const newPriority = overId.replace("priority-", "") as TaskPriority;
      const task = tasks.find((t) => t.id === activeId);
      if (task && task.priority !== newPriority) {
        updateTaskMutation.mutate({
          taskId: task.id,
          priority: newPriority,
        });
      }
    }
    // Handle drops into assignee containers
    else if (overId.startsWith("assignee-")) {
      const newAssigneeId = overId.replace("assignee-", "");
      const task = tasks.find((t) => t.id === activeId);
      if (
        task &&
        task.assigneeId !==
          (newAssigneeId === "unassigned" ? null : newAssigneeId)
      ) {
        updateTaskMutation.mutate({
          taskId: task.id,
          assigneeId: newAssigneeId === "unassigned" ? null : newAssigneeId,
        });
      }
    }
  };

  const handleCreateTask = (status: TaskStatus) => {
    setSelectedTask(null);
    openForm();
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    openForm();
  };

  const statusOptions = [
    { value: "todo", label: t("To Do") },
    { value: "in_progress", label: t("In Progress") },
    { value: "in_review", label: t("In Review") },
    { value: "done", label: t("Done") },
    { value: "blocked", label: t("Blocked") },
  ];

  const priorityOptions = [
    { value: "low", label: t("Low") },
    { value: "medium", label: t("Medium") },
    { value: "high", label: t("High") },
    { value: "urgent", label: t("Urgent") },
  ];

  const assigneeOptions = useMemo(() => {
    return users.map((user) => ({
      value: user.id,
      label: user.name,
      image: user.avatarUrl,
    }));
  }, [users]);

  const renderFilters = () => (
    <Group mb="md">
      <Menu position="bottom-start">
        <Menu.Target>
          <Button leftSection={<IconFilter size={16} />} variant="light">
            {t("Filters")}
          </Button>
        </Menu.Target>
        <Menu.Dropdown w={250}>
          <Menu.Label>{t("Status")}</Menu.Label>
          <Box p="xs">
            <MultiSelect
              data={statusOptions}
              value={statusFilter}
              onChange={(value: string[]) =>
                setStatusFilter(value as TaskStatus[])
              }
              placeholder={t("Filter by status")}
              size="xs"
              clearable
            />
          </Box>

          <Menu.Divider />

          <Menu.Label>{t("Priority")}</Menu.Label>
          <Box p="xs">
            <MultiSelect
              data={priorityOptions}
              value={priorityFilter}
              onChange={(value: string[]) =>
                setPriorityFilter(value as TaskPriority[])
              }
              placeholder={t("Filter by priority")}
              size="xs"
              clearable
            />
          </Box>

          <Menu.Divider />

          <Menu.Label>{t("Assignee")}</Menu.Label>
          <Box p="xs">
            <MultiSelect
              data={assigneeOptions}
              value={assigneeFilter}
              onChange={(value: string[]) => setAssigneeFilter(value)}
              placeholder={t("Filter by assignee")}
              size="xs"
              clearable
            />
          </Box>
        </Menu.Dropdown>
      </Menu>

      <SegmentedControl
        value={viewMode}
        onChange={(value) => setViewMode(value as ViewMode)}
        data={[
          {
            value: "kanban",
            label: (
              <Group gap={5}>
                <IconLayoutColumns size={16} />
                <span>{t("Kanban")}</span>
              </Group>
            ),
          },
          {
            value: "swimlane",
            label: (
              <Group gap={5}>
                <IconLayoutRows size={16} />
                <span>{t("Swimlanes")}</span>
              </Group>
            ),
          },
        ]}
      />

      {viewMode === "swimlane" && (
        <Select
          value={groupBy}
          onChange={(value) => setGroupBy(value as GroupBy)}
          data={[
            { value: "status", label: t("Group by Status") },
            { value: "assignee", label: t("Group by Assignee") },
            { value: "priority", label: t("Group by Priority") },
          ]}
          size="sm"
        />
      )}
    </Group>
  );

  const renderKanbanBoard = () => (
    <Flex
      gap="md"
      wrap="nowrap"
      style={{ overflowX: "auto", padding: "0 0 16px 0" }}
    >
      {Object.entries(statusGroups).map(([status, statusTasks]) => (
        <Box key={status} style={{ minWidth: 280 }}>
          <Paper
            id={`status-${status}`}
            withBorder
            p="md"
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Group justify="space-between" mb="sm">
              <Badge size="lg" variant="light">
                {t(
                  status === "todo"
                    ? "To Do"
                    : status === "in_progress"
                      ? "In Progress"
                      : status === "in_review"
                        ? "In Review"
                        : status === "done"
                          ? "Done"
                          : "Blocked"
                )}
              </Badge>
              <Text size="sm" c="dimmed">
                {statusTasks.length}
              </Text>
            </Group>

            <Stack gap="xs" style={{ flex: 1, minHeight: 200 }}>
              <SortableContext
                items={statusTasks.map((task) => task.id)}
                strategy={verticalListSortingStrategy}
              >
                {statusTasks.map((task) => (
                  <SortableTask
                    key={task.id}
                    id={task.id}
                    task={task}
                    onClick={() => handleEditTask(task)}
                    users={users}
                  />
                ))}
              </SortableContext>
            </Stack>

            <Button
              leftSection={<IconPlus size={16} />}
              variant="subtle"
              fullWidth
              mt="md"
              onClick={() => handleCreateTask(status as TaskStatus)}
            >
              {t("Add Task")}
            </Button>
          </Paper>
        </Box>
      ))}
    </Flex>
  );

  const renderSwimlanesByStatus = () => (
    <Stack>
      {Object.entries(statusGroups).map(([status, statusTasks]) => (
        <Paper key={status} withBorder p="md">
          <Group justify="space-between" mb="md">
            <Badge size="lg" variant="light">
              {t(
                status === "todo"
                  ? "To Do"
                  : status === "in_progress"
                    ? "In Progress"
                    : status === "in_review"
                      ? "In Review"
                      : status === "done"
                        ? "Done"
                        : "Blocked"
              )}
            </Badge>
            <Group>
              <Text size="sm" c="dimmed">
                {statusTasks.length}
              </Text>
              <Button
                leftSection={<IconPlus size={16} />}
                variant="subtle"
                size="xs"
                onClick={() => handleCreateTask(status as TaskStatus)}
              >
                {t("Add Task")}
              </Button>
            </Group>
          </Group>

          <Box
            id={`status-${status}`}
            style={{
              minHeight: statusTasks.length > 0 ? "auto" : 80,
              backgroundColor: "#f9f9f9",
              borderRadius: 8,
              padding: 8,
            }}
          >
            <SortableContext
              items={statusTasks.map((task) => task.id)}
              strategy={rectSortingStrategy}
            >
              <Flex gap="md" wrap="wrap">
                {statusTasks.map((task) => (
                  <Box key={task.id} style={{ width: 250 }}>
                    <SortableTask
                      id={task.id}
                      task={task}
                      onClick={() => handleEditTask(task)}
                      users={users}
                    />
                  </Box>
                ))}
                {statusTasks.length === 0 && (
                  <Text size="sm" c="dimmed" ta="center" w="100%" py="sm">
                    {t("No tasks")}
                  </Text>
                )}
              </Flex>
            </SortableContext>
          </Box>
        </Paper>
      ))}
    </Stack>
  );

  const renderSwimlanesByAssignee = () => (
    <Stack>
      {Object.entries(assigneeGroups).map(([assigneeId, assigneeTasks]) => (
        <Paper key={assigneeId} withBorder p="md">
          <Group justify="space-between" mb="md">
            <Group>
              <Badge size="lg" variant="light">
                {getAssigneeName(
                  assigneeId === "unassigned" ? null : assigneeId
                )}
              </Badge>
            </Group>
            <Group>
              <Text size="sm" c="dimmed">
                {assigneeTasks.length}
              </Text>
              <Button
                leftSection={<IconPlus size={16} />}
                variant="subtle"
                size="xs"
                onClick={() => handleCreateTask("todo")}
              >
                {t("Add Task")}
              </Button>
            </Group>
          </Group>

          <Box
            id={`assignee-${assigneeId}`}
            style={{
              minHeight: assigneeTasks.length > 0 ? "auto" : 80,
              backgroundColor: "#f9f9f9",
              borderRadius: 8,
              padding: 8,
            }}
          >
            <SortableContext
              items={assigneeTasks.map((task) => task.id)}
              strategy={rectSortingStrategy}
            >
              <Flex gap="md" wrap="wrap">
                {assigneeTasks.map((task) => (
                  <Box key={task.id} style={{ width: 250 }}>
                    <SortableTask
                      id={task.id}
                      task={task}
                      onClick={() => handleEditTask(task)}
                      users={users}
                    />
                  </Box>
                ))}
                {assigneeTasks.length === 0 && (
                  <Text size="sm" c="dimmed" ta="center" w="100%" py="sm">
                    {t("No tasks")}
                  </Text>
                )}
              </Flex>
            </SortableContext>
          </Box>
        </Paper>
      ))}
    </Stack>
  );

  const renderSwimlanesByPriority = () => (
    <Stack>
      {Object.entries(priorityGroups).map(([priority, priorityTasks]) => (
        <Paper key={priority} withBorder p="md">
          <Group justify="space-between" mb="md">
            <Badge
              size="lg"
              variant="light"
              color={
                priority === "urgent"
                  ? "red"
                  : priority === "high"
                    ? "orange"
                    : priority === "medium"
                      ? "blue"
                      : "gray"
              }
            >
              {t(priority.charAt(0).toUpperCase() + priority.slice(1))}
            </Badge>
            <Group>
              <Text size="sm" c="dimmed">
                {priorityTasks.length}
              </Text>
              <Button
                leftSection={<IconPlus size={16} />}
                variant="subtle"
                size="xs"
                onClick={() => handleCreateTask("todo")}
              >
                {t("Add Task")}
              </Button>
            </Group>
          </Group>

          <Box
            id={`priority-${priority}`}
            style={{
              minHeight: priorityTasks.length > 0 ? "auto" : 80,
              backgroundColor: "#f9f9f9",
              borderRadius: 8,
              padding: 8,
            }}
          >
            <SortableContext
              items={priorityTasks.map((task) => task.id)}
              strategy={rectSortingStrategy}
            >
              <Flex gap="md" wrap="wrap">
                {priorityTasks.map((task) => (
                  <Box key={task.id} style={{ width: 250 }}>
                    <SortableTask
                      id={task.id}
                      task={task}
                      onClick={() => handleEditTask(task)}
                      users={users}
                    />
                  </Box>
                ))}
                {priorityTasks.length === 0 && (
                  <Text size="sm" c="dimmed" ta="center" w="100%" py="sm">
                    {t("No tasks")}
                  </Text>
                )}
              </Flex>
            </SortableContext>
          </Box>
        </Paper>
      ))}
    </Stack>
  );

  const renderContent = () => {
    if (isTasksLoading) {
      return (
        <Flex justify="center" align="center" h={300}>
          <Loader />
        </Flex>
      );
    }

    if (viewMode === "kanban") {
      return renderKanbanBoard();
    }

    if (viewMode === "swimlane") {
      if (groupBy === "status") return renderSwimlanesByStatus();
      if (groupBy === "assignee") return renderSwimlanesByAssignee();
      if (groupBy === "priority") return renderSwimlanesByPriority();
    }
  };

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Group>
          <ActionIcon variant="subtle" onClick={onBack}>
            <IconArrowLeft />
          </ActionIcon>
          <Title order={3}>{project.name}</Title>
        </Group>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => handleCreateTask("todo")}
        >
          {t("New Task")}
        </Button>
      </Group>

      {renderFilters()}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        modifiers={[]}
      >
        {renderContent()}

        <DragOverlay>
          {activeId && activeDragData ? (
            <TaskCard
              task={activeDragData}
              onClick={() => {}}
              isDragging={true}
              users={users}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskFormModal
        opened={isFormOpen}
        onClose={closeForm}
        projectId={project.id}
        spaceId={project.spaceId}
        task={selectedTask}
      />
    </Box>
  );
}
