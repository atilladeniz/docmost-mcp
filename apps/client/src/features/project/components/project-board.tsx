import { useState, useMemo, useCallback, useRef } from "react";
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
  TextInput,
  Checkbox,
  Divider,
  Card,
  Tabs,
  useMantineTheme,
  Table,
  ScrollArea,
  Modal,
  rem,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconPlus,
  IconFilter,
  IconLayoutColumns,
  IconLayoutRows,
  IconList,
  IconCalendar,
  IconSearch,
  IconCalendarTime,
  IconTag,
  IconAdjustments,
  IconTrash,
  IconPencil,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useTasksByProject } from "../hooks/use-tasks";
import {
  Project,
  Task,
  TaskPriority,
  TaskStatus,
  Label,
  LabelColor,
} from "../types";
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
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { CustomAvatar } from "@/components/ui/custom-avatar";

// Initialize dayjs plugins
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

interface ProjectBoardProps {
  project: Project;
  onBack: () => void;
}

type ViewMode = "kanban" | "swimlane" | "list" | "timeline";
type GroupBy = "status" | "assignee" | "priority" | "date" | "labels";
type SortBy = "priority" | "dueDate" | "createdAt" | "title";
type SortOrder = "asc" | "desc";

export function ProjectBoard({ project, onBack }: ProjectBoardProps) {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [groupBy, setGroupBy] = useState<GroupBy>("status");
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [labelFilter, setLabelFilter] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [
    isAdvancedFiltersOpen,
    { open: openAdvancedFilters, close: closeAdvancedFilters },
  ] = useDisclosure(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("priority");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [dateRangeFilter, setDateRangeFilter] = useState<
    [Date | null, Date | null]
  >([null, null]);
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

    if (labelFilter.length > 0) {
      filtered = filtered.filter(
        (task) =>
          task.labels &&
          task.labels.some((label) => labelFilter.includes(label.id))
      );
    }

    if (!showCompletedTasks) {
      filtered = filtered.filter((task) => task.status !== "done");
    }

    // Apply date range filter
    if (dateRangeFilter[0] && dateRangeFilter[1]) {
      const startDate = dayjs(dateRangeFilter[0]);
      const endDate = dayjs(dateRangeFilter[1]);

      filtered = filtered.filter((task) => {
        if (!task.dueDate) return false;
        const taskDate = dayjs(task.dueDate);
        return (
          taskDate.isSameOrAfter(startDate, "day") &&
          taskDate.isSameOrBefore(endDate, "day")
        );
      });
    } else if (dateRangeFilter[0]) {
      const startDate = dayjs(dateRangeFilter[0]);
      filtered = filtered.filter((task) => {
        if (!task.dueDate) return false;
        return dayjs(task.dueDate).isSameOrAfter(startDate, "day");
      });
    } else if (dateRangeFilter[1]) {
      const endDate = dayjs(dateRangeFilter[1]);
      filtered = filtered.filter((task) => {
        if (!task.dueDate) return false;
        return dayjs(task.dueDate).isSameOrBefore(endDate, "day");
      });
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

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === "priority") {
        const priorityOrder = { urgent: 3, high: 2, medium: 1, low: 0 };
        const aPriority = a.priority ? priorityOrder[a.priority] : 0;
        const bPriority = b.priority ? priorityOrder[b.priority] : 0;
        return sortOrder === "desc"
          ? bPriority - aPriority
          : aPriority - bPriority;
      }

      if (sortBy === "dueDate") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return sortOrder === "desc" ? 1 : -1;
        if (!b.dueDate) return sortOrder === "desc" ? -1 : 1;
        return sortOrder === "desc"
          ? new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
          : new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      if (sortBy === "createdAt") {
        return sortOrder === "desc"
          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      if (sortBy === "title") {
        return sortOrder === "desc"
          ? b.title.localeCompare(a.title)
          : a.title.localeCompare(b.title);
      }

      return 0;
    });

    return filtered;
  }, [
    tasksData,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    labelFilter,
    searchTerm,
    dateRangeFilter,
    showCompletedTasks,
    sortBy,
    sortOrder,
  ]);

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

  const dateGroups = useMemo(() => {
    const groups: Record<string, Task[]> = {
      overdue: [],
      today: [],
      tomorrow: [],
      this_week: [],
      next_week: [],
      later: [],
      no_date: [],
    };

    const today = dayjs();
    const tomorrow = today.add(1, "day");
    const endOfWeek = today.endOf("week");
    const endOfNextWeek = today.add(1, "week").endOf("week");

    tasks.forEach((task) => {
      if (!task.dueDate) {
        groups.no_date.push(task);
      } else {
        const dueDate = dayjs(task.dueDate);

        if (dueDate.isBefore(today, "day")) {
          groups.overdue.push(task);
        } else if (dueDate.isSame(today, "day")) {
          groups.today.push(task);
        } else if (dueDate.isSame(tomorrow, "day")) {
          groups.tomorrow.push(task);
        } else if (
          dueDate.isBefore(endOfWeek) ||
          dueDate.isSame(endOfWeek, "day")
        ) {
          groups.this_week.push(task);
        } else if (
          dueDate.isBefore(endOfNextWeek) ||
          dueDate.isSame(endOfNextWeek, "day")
        ) {
          groups.next_week.push(task);
        } else {
          groups.later.push(task);
        }
      }
    });

    return groups;
  }, [tasks]);

  const labelGroups = useMemo(() => {
    const groups: Record<string, Task[]> = { no_labels: [] };

    // First, create a map of all available labels
    const labelsMap = new Map<string, Label>();
    tasks.forEach((task) => {
      if (task.labels && task.labels.length > 0) {
        task.labels.forEach((label) => {
          labelsMap.set(label.id, label);
        });
      }
    });

    // Initialize groups for each label
    labelsMap.forEach((label) => {
      groups[label.id] = [];
    });

    // Populate groups
    tasks.forEach((task) => {
      if (!task.labels || task.labels.length === 0) {
        groups.no_labels.push(task);
      } else {
        // Add the task to each of its label groups
        task.labels.forEach((label) => {
          if (groups[label.id]) {
            groups[label.id].push(task);
          }
        });
      }
    });

    return { groups, labelsMap };
  }, [tasks]);

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

  const getAssigneeName = useCallback(
    (assigneeId: string | null) => {
      if (!assigneeId) return t("Unassigned");
      const user = users.find((u) => u.id === assigneeId);
      return user ? user.name : t("Unknown User");
    },
    [users, t]
  );

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

  const labelOptions = useMemo(() => {
    const labels = Array.from(labelGroups.labelsMap.values()).map((label) => ({
      value: label.id,
      label: label.name,
      color: label.color,
    }));

    return labels;
  }, [labelGroups.labelsMap]);

  const renderFilters = () => (
    <Group mb="md">
      <TextInput
        placeholder={t("Search tasks...")}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        leftSection={<IconSearch size={16} />}
        size="sm"
        w={200}
      />

      <Button
        leftSection={<IconFilter size={16} />}
        variant="light"
        onClick={openAdvancedFilters}
      >
        {t("Filters")}
      </Button>

      <Modal
        opened={isAdvancedFiltersOpen}
        onClose={closeAdvancedFilters}
        title={
          <Group>
            <IconFilter size={18} />
            {t("Advanced Filters")}
          </Group>
        }
        size="md"
      >
        <Stack>
          <Box>
            <Text fw={500} mb="xs">
              {t("Status")}
            </Text>
            <MultiSelect
              data={statusOptions}
              value={statusFilter}
              onChange={(value: string[]) =>
                setStatusFilter(value as TaskStatus[])
              }
              placeholder={t("Select statuses")}
              clearable
            />
          </Box>

          <Box>
            <Text fw={500} mb="xs">
              {t("Priority")}
            </Text>
            <MultiSelect
              data={priorityOptions}
              value={priorityFilter}
              onChange={(value: string[]) =>
                setPriorityFilter(value as TaskPriority[])
              }
              placeholder={t("Select priorities")}
              clearable
            />
          </Box>

          <Box>
            <Text fw={500} mb="xs">
              {t("Assignee")}
            </Text>
            <MultiSelect
              data={assigneeOptions}
              value={assigneeFilter}
              onChange={(value: string[]) => setAssigneeFilter(value)}
              placeholder={t("Select assignees")}
              clearable
            />
          </Box>

          <Box>
            <Text fw={500} mb="xs">
              {t("Labels")}
            </Text>
            <MultiSelect
              data={labelOptions}
              value={labelFilter}
              onChange={(value: string[]) => setLabelFilter(value)}
              placeholder={t("Select labels")}
              clearable
            />
          </Box>

          <Box>
            <Text fw={500} mb="xs">
              {t("Due Date Range")}
            </Text>
            <Group>
              <TextInput
                type="date"
                label={t("From")}
                value={
                  dateRangeFilter[0]
                    ? dayjs(dateRangeFilter[0]).format("YYYY-MM-DD")
                    : ""
                }
                onChange={(e) => {
                  const newFrom = e.target.value
                    ? new Date(e.target.value)
                    : null;
                  setDateRangeFilter([newFrom, dateRangeFilter[1]]);
                }}
              />
              <TextInput
                type="date"
                label={t("To")}
                value={
                  dateRangeFilter[1]
                    ? dayjs(dateRangeFilter[1]).format("YYYY-MM-DD")
                    : ""
                }
                onChange={(e) => {
                  const newTo = e.target.value
                    ? new Date(e.target.value)
                    : null;
                  setDateRangeFilter([dateRangeFilter[0], newTo]);
                }}
              />
            </Group>
          </Box>

          <Checkbox
            label={t("Show completed tasks")}
            checked={showCompletedTasks}
            onChange={(e) => setShowCompletedTasks(e.currentTarget.checked)}
          />

          <Divider my="sm" />

          <Box>
            <Text fw={500} mb="xs">
              {t("Sort By")}
            </Text>
            <Group>
              <Select
                data={[
                  { value: "priority", label: t("Priority") },
                  { value: "dueDate", label: t("Due Date") },
                  { value: "createdAt", label: t("Created Date") },
                  { value: "title", label: t("Title") },
                ]}
                value={sortBy}
                onChange={(value) => setSortBy(value as SortBy)}
                size="sm"
              />
              <Select
                data={[
                  { value: "asc", label: t("Ascending") },
                  { value: "desc", label: t("Descending") },
                ]}
                value={sortOrder}
                onChange={(value) => setSortOrder(value as SortOrder)}
                size="sm"
              />
            </Group>
          </Box>

          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter([]);
                setPriorityFilter([]);
                setAssigneeFilter([]);
                setLabelFilter([]);
                setDateRangeFilter([null, null]);
                setShowCompletedTasks(true);
                setSortBy("priority");
                setSortOrder("desc");
                setSearchTerm("");
              }}
            >
              {t("Clear All")}
            </Button>
            <Button onClick={closeAdvancedFilters}>{t("Apply Filters")}</Button>
          </Group>
        </Stack>
      </Modal>

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
          {
            value: "list",
            label: (
              <Group gap={5}>
                <IconList size={16} />
                <span>{t("List")}</span>
              </Group>
            ),
          },
          {
            value: "timeline",
            label: (
              <Group gap={5}>
                <IconCalendar size={16} />
                <span>{t("Timeline")}</span>
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
            { value: "date", label: t("Group by Due Date") },
            { value: "labels", label: t("Group by Labels") },
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

  const renderSwimlanesByDate = () => (
    <Stack>
      {Object.entries(dateGroups).map(([dateKey, dateTasks]) => {
        let title;
        let color: string;

        switch (dateKey) {
          case "overdue":
            title = t("Overdue");
            color = "red";
            break;
          case "today":
            title = t("Today");
            color = "blue";
            break;
          case "tomorrow":
            title = t("Tomorrow");
            color = "teal";
            break;
          case "this_week":
            title = t("This Week");
            color = "green";
            break;
          case "next_week":
            title = t("Next Week");
            color = "grape";
            break;
          case "later":
            title = t("Later");
            color = "gray";
            break;
          case "no_date":
            title = t("No Due Date");
            color = "dark";
            break;
          default:
            title = dateKey;
            color = "blue";
        }

        return (
          <Paper key={dateKey} withBorder p="md">
            <Group justify="space-between" mb="md">
              <Badge size="lg" variant="light" color={color}>
                {title}
              </Badge>
              <Group>
                <Text size="sm" c="dimmed">
                  {dateTasks.length}
                </Text>
                <Button
                  leftSection={<IconPlus size={16} />}
                  variant="subtle"
                  size="xs"
                  onClick={() => {
                    const dueDate =
                      dateKey === "today"
                        ? dayjs().format("YYYY-MM-DD")
                        : dateKey === "tomorrow"
                          ? dayjs().add(1, "day").format("YYYY-MM-DD")
                          : undefined;

                    const dummyTask = {
                      dueDate,
                      status: "todo" as TaskStatus,
                    } as Task;
                    setSelectedTask(dummyTask);
                    openForm();
                  }}
                >
                  {t("Add Task")}
                </Button>
              </Group>
            </Group>

            <Box
              id={`date-${dateKey}`}
              style={{
                minHeight: dateTasks.length > 0 ? "auto" : 80,
                backgroundColor: "#f9f9f9",
                borderRadius: 8,
                padding: 8,
              }}
            >
              <SortableContext
                items={dateTasks.map((task) => task.id)}
                strategy={rectSortingStrategy}
              >
                <Flex gap="md" wrap="wrap">
                  {dateTasks.map((task) => (
                    <Box key={task.id} style={{ width: 250 }}>
                      <SortableTask
                        id={task.id}
                        task={task}
                        onClick={() => handleEditTask(task)}
                        users={users}
                      />
                    </Box>
                  ))}
                  {dateTasks.length === 0 && (
                    <Text size="sm" c="dimmed" ta="center" w="100%" py="sm">
                      {t("No tasks")}
                    </Text>
                  )}
                </Flex>
              </SortableContext>
            </Box>
          </Paper>
        );
      })}
    </Stack>
  );

  const renderSwimlanesByLabels = () => (
    <Stack>
      {Object.entries(labelGroups.groups).map(([labelId, labelTasks]) => {
        const label =
          labelId === "no_labels"
            ? { name: t("No Labels"), color: "gray" as LabelColor }
            : labelGroups.labelsMap.get(labelId);

        if (!label && labelId !== "no_labels") return null;

        return (
          <Paper key={labelId} withBorder p="md">
            <Group justify="space-between" mb="md">
              <Badge size="lg" variant="light" color={label?.color || "gray"}>
                {label?.name || t("Unknown Label")}
              </Badge>
              <Group>
                <Text size="sm" c="dimmed">
                  {labelTasks.length}
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
              id={`label-${labelId}`}
              style={{
                minHeight: labelTasks.length > 0 ? "auto" : 80,
                backgroundColor: "#f9f9f9",
                borderRadius: 8,
                padding: 8,
              }}
            >
              <SortableContext
                items={labelTasks.map((task) => task.id)}
                strategy={rectSortingStrategy}
              >
                <Flex gap="md" wrap="wrap">
                  {labelTasks.map((task) => (
                    <Box key={task.id} style={{ width: 250 }}>
                      <SortableTask
                        id={task.id}
                        task={task}
                        onClick={() => handleEditTask(task)}
                        users={users}
                      />
                    </Box>
                  ))}
                  {labelTasks.length === 0 && (
                    <Text size="sm" c="dimmed" ta="center" w="100%" py="sm">
                      {t("No tasks")}
                    </Text>
                  )}
                </Flex>
              </SortableContext>
            </Box>
          </Paper>
        );
      })}
    </Stack>
  );

  const renderList = () => (
    <Paper withBorder p="md">
      <ScrollArea h={600}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("Title")}</Table.Th>
              <Table.Th>{t("Status")}</Table.Th>
              <Table.Th>{t("Priority")}</Table.Th>
              <Table.Th>{t("Assignee")}</Table.Th>
              <Table.Th>{t("Due Date")}</Table.Th>
              <Table.Th>{t("Labels")}</Table.Th>
              <Table.Th>{t("Actions")}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {tasks.map((task) => (
              <Table.Tr
                key={task.id}
                onClick={() => handleEditTask(task)}
                style={{ cursor: "pointer" }}
              >
                <Table.Td>{task.title}</Table.Td>
                <Table.Td>
                  <Badge
                    color={
                      task.status === "done"
                        ? "green"
                        : task.status === "blocked"
                          ? "red"
                          : task.status === "in_progress"
                            ? "blue"
                            : task.status === "in_review"
                              ? "indigo"
                              : "gray"
                    }
                  >
                    {t(
                      task.status === "todo"
                        ? "To Do"
                        : task.status === "in_progress"
                          ? "In Progress"
                          : task.status === "in_review"
                            ? "In Review"
                            : task.status === "done"
                              ? "Done"
                              : "Blocked"
                    )}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge
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
                    {t(
                      task.priority?.charAt(0).toUpperCase() +
                        task.priority?.slice(1) || "Medium"
                    )}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {task.assigneeId ? (
                    <Group>
                      <CustomAvatar
                        size="sm"
                        avatarUrl={
                          users.find((u) => u.id === task.assigneeId)
                            ?.avatarUrl || ""
                        }
                        name={getAssigneeName(task.assigneeId)}
                      />
                      <Text size="sm">{getAssigneeName(task.assigneeId)}</Text>
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed">
                      {t("Unassigned")}
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {task.dueDate ? (
                    <Text
                      size="sm"
                      c={
                        dayjs(task.dueDate).isBefore(dayjs(), "day")
                          ? "red"
                          : undefined
                      }
                    >
                      {dayjs(task.dueDate).format("MMM D, YYYY")}
                    </Text>
                  ) : (
                    <Text size="sm" c="dimmed">
                      -
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    {task.labels &&
                      task.labels.map((label) => (
                        <Badge key={label.id} color={label.color} size="sm">
                          {label.name}
                        </Badge>
                      ))}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group>
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTask(task);
                      }}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Paper>
  );

  const renderTimeline = () => {
    // Group tasks by date
    const tasksByDate: Record<string, Task[]> = {};

    // Initialize with dates from the current week and next week
    const today = dayjs();
    for (let i = -7; i <= 14; i++) {
      const date = today.add(i, "day");
      const dateStr = date.format("YYYY-MM-DD");
      tasksByDate[dateStr] = [];
    }

    // Add tasks to their respective dates
    tasks.forEach((task) => {
      if (task.dueDate) {
        const dateStr = dayjs(task.dueDate).format("YYYY-MM-DD");
        if (!tasksByDate[dateStr]) {
          tasksByDate[dateStr] = [];
        }
        tasksByDate[dateStr].push(task);
      }
    });

    return (
      <ScrollArea h={600}>
        <Box p="md">
          {Object.entries(tasksByDate).map(([dateStr, dateTasks]) => {
            const date = dayjs(dateStr);
            const isToday = date.isSame(today, "day");
            const isPast = date.isBefore(today, "day");

            return (
              <Box
                key={dateStr}
                mb="md"
                style={{
                  borderLeft: `4px solid ${isToday ? theme.colors.blue[5] : isPast ? theme.colors.gray[4] : theme.colors.gray[3]}`,
                  paddingLeft: 16,
                }}
              >
                <Group mb="xs" justify="space-between">
                  <Text
                    fw={500}
                    c={isToday ? "blue" : isPast ? "dimmed" : undefined}
                  >
                    {date.format("dddd, MMMM D")}
                    {isToday && (
                      <Badge ml="xs" color="blue">
                        {t("Today")}
                      </Badge>
                    )}
                  </Text>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    variant="subtle"
                    size="xs"
                    onClick={() => {
                      const dummyTask = {
                        dueDate: dateStr,
                        status: "todo" as TaskStatus,
                      } as Task;
                      setSelectedTask(dummyTask);
                      openForm();
                    }}
                  >
                    {t("Add Task")}
                  </Button>
                </Group>

                {dateTasks.length > 0 ? (
                  <Flex gap="md" wrap="wrap">
                    {dateTasks.map((task) => (
                      <Box key={task.id} style={{ width: 250 }}>
                        <TaskCard
                          task={task}
                          onClick={() => handleEditTask(task)}
                          users={users}
                        />
                      </Box>
                    ))}
                  </Flex>
                ) : (
                  <Text size="sm" c="dimmed" py="sm">
                    {t("No tasks scheduled")}
                  </Text>
                )}
              </Box>
            );
          })}
        </Box>
      </ScrollArea>
    );
  };

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

    if (viewMode === "list") {
      return renderList();
    }

    if (viewMode === "timeline") {
      return renderTimeline();
    }

    if (viewMode === "swimlane") {
      if (groupBy === "status") return renderSwimlanesByStatus();
      if (groupBy === "assignee") return renderSwimlanesByAssignee();
      if (groupBy === "priority") return renderSwimlanesByPriority();
      if (groupBy === "date") return renderSwimlanesByDate();
      if (groupBy === "labels") return renderSwimlanesByLabels();
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
