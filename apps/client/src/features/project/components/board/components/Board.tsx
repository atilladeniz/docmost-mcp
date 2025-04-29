import { useState } from "react";
import { Flex, Stack, Box, Text, Loader } from "@mantine/core";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { BoardProvider, useBoardContext } from "../board-context";
import { BoardHeader } from "./BoardHeader";
import { BoardControls } from "./BoardControls";
import { BoardColumn } from "./BoardColumn";
import { BoardSwimlane } from "./BoardSwimlane";
import { BoardList } from "./BoardList";
import { BoardTimeline } from "./BoardTimeline";
import {
  useFilteredTasks,
  useGroupedTasks,
  useTaskOperations,
} from "../board-hooks";
import { TaskCard } from "../../../components/task-card";
import { Task, Project } from "../../../types";
import { useDisclosure } from "@mantine/hooks";
import { useWorkspaceUsers } from "@/features/user/hooks/use-workspace-users";

interface BoardProps {
  project: Project;
  onBack: () => void;
}

export function Board({ project, onBack }: BoardProps) {
  return (
    <BoardProvider project={project} onBack={onBack}>
      <BoardContent />
    </BoardProvider>
  );
}

function BoardContent() {
  const {
    project,
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
    activeId,
    setActiveId,
    activeDragData,
    setActiveDragData,
    isFormOpen,
    openForm,
    closeForm,
    selectedTask,
    setSelectedTask,
    isAdvancedFiltersOpen,
    openAdvancedFilters,
    closeAdvancedFilters,
  } = useBoardContext();

  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  // Get filtered tasks
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

  // Get grouped tasks based on selected grouping
  const {
    groupedTasks,
    users,
    isLoading: isUsersLoading,
  } = useGroupedTasks({
    tasks,
    groupBy,
    workspaceId: project.workspaceId,
  });

  // Task operations
  const {
    updateTaskStatus,
    updateTaskAssignee,
    updateTaskPriority,
    isUpdating,
  } = useTaskOperations();

  // Handle task creation
  const handleCreateTask = (status) => {
    setSelectedTask(null);
    openForm();
  };

  // Wrapper for components that don't pass status
  const handleCreateTaskWithoutStatus = () => {
    handleCreateTask("todo"); // Default to 'todo' status
  };

  // Handle task editing
  const handleEditTask = (task) => {
    setSelectedTask(task);
    openForm();
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
      default:
        return (
          <Text ta="center" size="lg" py="xl">
            Unknown view mode
          </Text>
        );
    }
  };

  // Render Kanban board view
  const renderKanbanBoard = () => {
    // We wrap kanban board with DndContext
    return (
      <DndContext
        sensors={[]} // You'll need to set up sensors properly
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Flex
          gap="md"
          wrap="nowrap"
          style={{ overflowX: "auto", padding: "0 0 16px 0" }}
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
        </Flex>

        <DragOverlay>
          {activeId && activeDragData ? (
            <TaskCard
              task={activeDragData}
              users={users}
              onClick={() => {
                /* Drag overlay doesn't need click handler */
              }}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  };

  // Render Swimlanes view
  const renderSwimlanes = () => {
    // We wrap swimlanes with DndContext
    return (
      <DndContext
        sensors={[]} // You'll need to set up sensors properly
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Stack>
          {Object.entries(groupedTasks).map(([groupKey, groupTasks]) => (
            <BoardSwimlane
              key={groupKey}
              id={groupKey}
              title={getLabelForGroupKey(groupKey, groupBy)}
              tasks={groupTasks as Task[]}
              users={users}
              onCreateTask={handleCreateTask}
              onEditTask={handleEditTask}
              containerId={`${groupBy}-${groupKey}`}
            />
          ))}
        </Stack>

        <DragOverlay>
          {activeId && activeDragData ? (
            <TaskCard
              task={activeDragData}
              users={users}
              onClick={() => {
                /* Drag overlay doesn't need click handler */
              }}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  };

  // Helper to get label for group keys
  const getLabelForGroupKey = (key: string, groupType: string) => {
    // This would need to be implemented based on your application's needs
    return key; // Placeholder
  };

  return (
    <Box>
      <BoardHeader onToggleFilters={toggleFilters} />

      <BoardControls isVisible={isFiltersVisible} />

      {renderContent()}

      {/* Task form modal would go here */}
    </Box>
  );
}
