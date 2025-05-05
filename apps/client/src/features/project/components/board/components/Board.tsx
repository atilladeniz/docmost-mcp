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
import {
  useFilteredTasks,
  useGroupedTasks,
  useTaskOperations,
} from "../board-hooks";
import { TaskCard } from "../../../components/task-card";
import { Task, Project } from "../../../types";
import { useDisclosure } from "@mantine/hooks";
import { useWorkspaceUsers } from "@/features/user/hooks/use-workspace-users";
import { ProjectHeader } from "@/features/project/components/project-header.tsx";
import { IconArrowLeft } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import TaskFormModal from "../../../components/task-form-modal";

// CSS class name for when we need to disable scrolling
const NO_SCROLL_CLASS = "docmost-board-no-scroll";

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
    onBack,
  } = useBoardContext();

  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  // Add a state to track if mouse is over the kanban board
  const [isOverKanban, setIsOverKanban] = useState(false);

  // References to the main scroll containers
  const kanbanScrollRef = useRef<HTMLDivElement>(null);
  const swimlanesScrollRef = useRef<HTMLDivElement>(null);

  // Effect to add no-scroll class to body when mouse is over kanban
  useEffect(() => {
    // Add a style block to the document head if it doesn't exist
    let styleElem = document.getElementById("board-no-scroll-style");
    if (!styleElem) {
      styleElem = document.createElement("style");
      styleElem.id = "board-no-scroll-style";
      styleElem.textContent = `.${NO_SCROLL_CLASS} { overflow: hidden !important; }`;
      document.head.appendChild(styleElem);
    }

    if (isOverKanban) {
      document.body.classList.add(NO_SCROLL_CLASS);
    } else {
      document.body.classList.remove(NO_SCROLL_CLASS);
    }

    return () => {
      document.body.classList.remove(NO_SCROLL_CLASS);
    };
  }, [isOverKanban]);

  // Effect to handle wheel events with non-passive listeners
  useEffect(() => {
    // Only set up listeners when in kanban view
    if (viewMode !== "kanban") return;

    // Function to handle all scroll events (both trackpad and wheel)
    const handleScroll = (e: WheelEvent) => {
      // Only handle events when mouse is over the kanban area
      if (!isOverKanban || !kanbanScrollRef.current) return;

      // Always use any available horizontal delta (for trackpads)
      if (e.deltaX !== 0) {
        e.preventDefault();

        // Apply horizontal scrolling directly from the event
        // Increase multiplier to 4x for much faster scrolling
        kanbanScrollRef.current.scrollLeft += e.deltaX * 4;

        // For debugging - console log to see if trackpad events are being captured
        console.log("Horizontal scroll detected:", e.deltaX);
      }
    };

    // Attach the event listener to the document - this captures events across the entire board
    document.addEventListener("wheel", handleScroll, { passive: false });

    // Clean up
    return () => {
      document.removeEventListener("wheel", handleScroll);
    };
  }, [viewMode, isOverKanban]);

  // Add a second useEffect to ensure the scroll container is captured correctly
  useEffect(() => {
    // This effect runs when the ref is updated or the view mode changes
    const scrollContainer = kanbanScrollRef.current;

    if (viewMode === "kanban" && scrollContainer) {
      // Apply styles that might help with scrolling
      scrollContainer.style.overflowX = "auto";
      scrollContainer.style.overflowY = "hidden";
      scrollContainer.style.scrollBehavior = "smooth";
    }
  }, [viewMode, kanbanScrollRef.current]);

  // Separate effect for swimlanes view
  useEffect(() => {
    // Only set up listeners when in swimlane view
    if (viewMode !== "swimlane") return;

    // Function to handle wheel events for swimlanes view
    const handleSwimlanesWheel = (e: WheelEvent) => {
      // Let default vertical scrolling work naturally for swimlanes
      if (!swimlanesScrollRef.current) return;

      // Optional: can add custom behavior here if needed
    };

    // Add event listener if needed for swimlanes
    if (swimlanesScrollRef.current) {
      swimlanesScrollRef.current.addEventListener(
        "wheel",
        handleSwimlanesWheel,
        { passive: true }
      );
    }

    return () => {
      if (swimlanesScrollRef.current) {
        swimlanesScrollRef.current.removeEventListener(
          "wheel",
          handleSwimlanesWheel
        );
      }
    };
  }, [viewMode, swimlanesScrollRef]);

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
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Main board container with fixed dimensions */}
        <Box
          style={{
            width: "100%",
            height: "calc(100vh - 250px)",
            minHeight: "350px",
            position: "relative",
          }}
          onMouseEnter={() => setIsOverKanban(true)}
          onMouseLeave={() => setIsOverKanban(false)}
        >
          {/* Scrollable container - ONLY handles horizontal scrolling */}
          <Box
            ref={kanbanScrollRef}
            style={{
              width: "100%",
              height: "100%",
              overflowX: "auto",
              overflowY: "hidden", // Prevent vertical scrolling
              padding: "0px 0px 15px 0px", // Space for the scrollbar at bottom
              WebkitOverflowScrolling: "touch",
              msOverflowStyle: "-ms-autohiding-scrollbar",
              scrollbarWidth: "thin",
              cursor: "default",
              scrollBehavior: "smooth", // Add smooth scrolling behavior
            }}
          >
            {/* This is the actual draggable area - doesn't scroll itself */}
            <Flex
              gap="md"
              wrap="nowrap"
              style={{
                padding: "4px",
                minWidth: "min-content", // Important to ensure it expands to fit all columns
                width: "max-content", // Ensure it takes up as much space as needed
                height: "100%",
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
            </Flex>
          </Box>

          {/* Helper element for drag scrolling - overlaid on top but doesn't interfere with drag events */}
          <Box
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 15, // Leave space for scrollbar
              pointerEvents: "none", // Don't interfere with drag and drop
              zIndex: 10,
            }}
            onMouseDown={(e) => {
              // Only react to direct clicks on this element (not bubbled events)
              // This prevents interfering with task dragging
              if (e.currentTarget === e.target) {
                e.preventDefault();
                e.stopPropagation();

                // Make this element capture events during the drag
                e.currentTarget.style.pointerEvents = "auto";

                // Find the scrollable container
                const scrollContainer = kanbanScrollRef.current;
                if (scrollContainer) {
                  const startX = e.clientX;
                  const startScrollLeft = scrollContainer.scrollLeft;

                  const mouseMoveHandler = (e) => {
                    const dx = e.clientX - startX;
                    scrollContainer.scrollLeft = startScrollLeft - dx;
                    e.currentTarget.style.cursor = "grabbing";
                  };

                  const mouseUpHandler = () => {
                    document.removeEventListener("mousemove", mouseMoveHandler);
                    document.removeEventListener("mouseup", mouseUpHandler);
                    // Stop capturing events
                    e.currentTarget.style.pointerEvents = "none";
                    e.currentTarget.style.cursor = "default";
                  };

                  document.addEventListener("mousemove", mouseMoveHandler);
                  document.addEventListener("mouseup", mouseUpHandler);
                }
              }
            }}
          />
        </Box>

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
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box
          style={{
            position: "relative",
            width: "100%",
            height: "calc(100vh - 250px)",
            minHeight: "500px",
            overflow: "hidden",
          }}
          onMouseEnter={() => setIsOverKanban(true)}
          onMouseLeave={() => setIsOverKanban(false)}
        >
          <Stack
            ref={swimlanesScrollRef}
            style={{
              height: "100%",
              width: "100%",
              overflowY: "auto",
              overflowX: "hidden",
              scrollbarWidth: "thin",
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
              msOverflowStyle: "-ms-autohiding-scrollbar",
              padding: "0 4px 15px 4px",
              cursor: "default",
            }}
            // We don't use onWheel here anymore, it's handled by the useEffect
          >
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
        </Box>

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

  const { t } = useTranslation();

  return (
    <Stack gap="md">
      {/* Project header with all project details */}
      <ProjectHeader project={project} />

      {/* Back button removed as breadcrumbs already provide this functionality */}

      {/* Board header with view controls */}
      <BoardHeader onToggleFilters={toggleFilters} />

      {/* Board filters if visible */}
      {isFiltersVisible && <BoardControls isVisible={true} />}

      {/* Main board content area */}
      {renderContent()}

      {/* Task form modal */}
      <TaskFormModal
        opened={isFormOpen}
        onClose={closeForm}
        projectId={project.id}
        spaceId={project.spaceId}
        task={selectedTask}
      />
    </Stack>
  );
}
