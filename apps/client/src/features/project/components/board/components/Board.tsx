import { useState, useEffect, useRef } from "react";
import {
  Flex,
  Stack,
  Box,
  Text,
  Loader,
  Button,
  Group,
  Tooltip,
} from "@mantine/core";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  DragEndEvent,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import { BoardProvider, useBoardContext } from "../board-context";
import { BoardHeader } from "./BoardHeader";
import { BoardControls } from "./BoardControls";
import { BoardColumn } from "./BoardColumn";
import { BoardSwimlane } from "./BoardSwimlane";
import { BoardList } from "./BoardList";
import { BoardTimeline } from "./BoardTimeline";
import { BoardColumns } from "./BoardColumns";
import {
  useFilteredTasks,
  useGroupedTasks,
  useTaskOperations,
} from "../board-hooks";
import { TaskCard } from "../../../components/task-card";
import { Task } from "../../../types";
import { useDisclosure } from "@mantine/hooks";
import { useWorkspaceUsers } from "@/features/user/hooks/use-workspace-users";
import { ProjectHeader } from "@/features/project/components/project-header.tsx";
import { IconArrowLeft } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import TaskFormModal from "../../../components/task-form-modal";
import { TaskDrawer } from "../../../components/task-drawer";

// CSS class name for when we need to disable scrolling
const NO_SCROLL_CLASS = "docmost-board-no-scroll";

// Basic Project interface
interface Project {
  id: string;
  name: string;
  workspaceId: string;
}

interface BoardProps {
  project: Project;
  onBack: () => void;
}

export function Board({ project, onBack }: BoardProps) {
  return (
    <BoardProvider project={project} onBack={onBack}>
      <Box>
        <ProjectHeader project={project} onBack={onBack} />
        <BoardContent project={project} spaceId={project.spaceId} />
      </Box>
    </BoardProvider>
  );
}

function BoardContent({ project, spaceId }) {
  const { t } = useTranslation();

  console.log(
    "BoardContent rendering with project:",
    project,
    "spaceId:",
    spaceId
  );

  const [opened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<Task | null>(null);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const {
    viewMode,
    groupBy,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    labelFilter,
    searchTerm,
    showCompletedTasks,
    dateRangeFilter,
    sortBy,
    sortOrder,
  } = useBoardContext();

  // Get the tasks based on the project and filters
  const { tasks, isLoading: isTasksLoading } = useFilteredTasks({
    projectId: project.id,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    labelFilter,
    searchTerm,
    showCompletedTasks,
    dateRangeFilter,
    sortBy,
    sortOrder,
  });

  // Get the users for avatar display
  const { data: usersData, isLoading: isUsersLoading } = useWorkspaceUsers({
    workspaceId: project.workspaceId,
  });
  const users = usersData?.items || [];

  // Get the task update operations
  const { updateTaskStatus } = useTaskOperations();

  // Group tasks by the selected grouping method
  const { groupedTasks } = useGroupedTasks({
    tasks,
    groupBy,
    workspaceId: project.workspaceId,
  });

  // Prevent scrolling when dragging
  useEffect(() => {
    if (activeId) {
      document.body.classList.add(NO_SCROLL_CLASS);
    } else {
      document.body.classList.remove(NO_SCROLL_CLASS);
    }

    return () => {
      document.body.classList.remove(NO_SCROLL_CLASS);
    };
  }, [activeId]);

  // Render Kanban board
  const renderKanbanBoard = () => {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Flex
          gap="md"
          align="stretch"
          style={{
            minHeight: "calc(100vh - 300px)",
            maxHeight: "calc(100vh - 200px)",
            overflowX: "auto",
            overflowY: "hidden",
            padding: "0.5rem",
          }}
        >
          {Object.entries(groupedTasks).map(([status, statusTasks]) => (
            <BoardColumn
              key={status}
              status={status as any}
              tasks={statusTasks as Task[]}
              users={users}
              onCreateTask={handleCreateTask}
              onEditTask={handleEditTask}
            />
          ))}

          {/* Drag overlay showing the task being dragged */}
          <DragOverlay>
            {activeId && activeDragData ? (
              <Box style={{ width: "250px", opacity: 0.8 }}>
                <TaskCard
                  task={activeDragData}
                  onClick={() => {}}
                  isDragging={true}
                  users={users}
                />
              </Box>
            ) : null}
          </DragOverlay>
        </Flex>
      </DndContext>
    );
  };

  // Render Swimlanes
  const renderSwimlanes = () => {
    const containerId = "board-swimlanes";

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box
          id={containerId}
          style={{
            minHeight: "calc(100vh - 300px)",
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
            padding: "0.5rem",
          }}
        >
          <Stack gap="md">
            {Object.entries(groupedTasks).map(([lane, laneTasks]) => (
              <BoardSwimlane
                key={lane}
                id={lane}
                title={lane}
                tasks={laneTasks as Task[]}
                users={users}
                onCreateTask={handleCreateTask}
                onEditTask={handleEditTask}
                containerId={containerId}
              />
            ))}
          </Stack>

          {/* Drag overlay showing the task being dragged */}
          <DragOverlay>
            {activeId && activeDragData ? (
              <Box style={{ width: "250px", opacity: 0.8 }}>
                <TaskCard
                  task={activeDragData}
                  onClick={() => {}}
                  isDragging={true}
                  users={users}
                />
              </Box>
            ) : null}
          </DragOverlay>
        </Box>
      </DndContext>
    );
  };

  // Handle task creation
  const handleCreateTask = (status) => {
    // Make sure status is a valid TaskStatus
    const validStatus = [
      "todo",
      "in_progress",
      "in_review",
      "done",
      "blocked",
    ].includes(status)
      ? status
      : "todo";

    // Store the selected status in the board context
    setSelectedTask({
      status: validStatus, // Use validated status
      title: "",
      description: "",
      priority: "medium",
    } as any);
    openForm();
  };

  // Wrapper for components that don't pass status
  const handleCreateTaskWithoutStatus = () => {
    handleCreateTask("todo"); // Default to 'todo' status
  };

  // Handle task editing
  const handleEditTask = (task) => {
    setSelectedTaskId(task.id);
    setDrawerOpened(true);
  };

  // Handle drawer close
  const handleDrawerClose = () => {
    setDrawerOpened(false);
    setSelectedTaskId(null);
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const draggedTask = tasks.find((task) => task.id === active.id);
    setActiveDragData(draggedTask || null);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Get the container ID to identify where the task was dropped
      const overId = String(over.id);

      // Update task status based on where it was dropped
      if (overId.startsWith("status-")) {
        const status = overId.replace("status-", "") as any;
        const taskId = String(active.id);
        updateTaskStatus(taskId, status);
      }
    }

    setActiveId(null);
    setActiveDragData(null);
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setIsFiltersVisible(!isFiltersVisible);
  };

  // Set up proper DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts - allows for click events
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event) => {
        // Implementation for keyboard coordinates getter if needed
        return null;
      },
    })
  );

  // Render the appropriate view based on viewMode
  const renderContent = () => {
    if (isTasksLoading || isUsersLoading) {
      return (
        <Box ta="center" py="xl">
          <Loader size="lg" />
          <Text mt="md">Loading tasks...</Text>
        </Box>
      );
    }

    switch (viewMode) {
      case "kanban":
        return renderKanbanBoard();
      case "swimlane":
        return renderSwimlanes();
      case "list":
        return (
          <BoardList
            tasks={tasks}
            users={users}
            onEditTask={handleEditTask}
            onCreateTask={handleCreateTaskWithoutStatus}
          />
        );
      case "timeline":
        return (
          <BoardTimeline
            tasks={tasks}
            users={users}
            onEditTask={handleEditTask}
            onCreateTask={handleCreateTaskWithoutStatus}
          />
        );
      case "columns":
        return (
          <BoardColumns
            tasks={tasks}
            users={users}
            onEditTask={handleEditTask}
            onCreateTask={handleCreateTaskWithoutStatus}
          />
        );
      default:
        return (
          <Text ta="center" size="lg" py="xl">
            Unknown view mode
          </Text>
        );
    }
  };

  return (
    <Box>
      <BoardHeader onToggleFilters={toggleFilters} />

      <BoardControls isVisible={isFiltersVisible} />

      {renderContent()}

      {/* Task Creation Modal */}
      <TaskFormModal
        opened={opened}
        onClose={closeForm}
        projectId={project.id}
        spaceId={spaceId}
        task={selectedTask}
      />

      {/* Task Drawer */}
      <TaskDrawer
        taskId={selectedTaskId}
        opened={drawerOpened}
        onClose={handleDrawerClose}
        spaceId={spaceId}
      />
    </Box>
  );
}
