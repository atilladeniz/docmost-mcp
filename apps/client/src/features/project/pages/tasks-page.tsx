import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Group,
  Title,
  Text,
  Breadcrumbs,
  Anchor,
  Button,
  Card,
  Loader,
  Stack,
} from "@mantine/core";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrentSpace } from "@/features/space/hooks/use-current-space";
import { useCurrentWorkspace } from "@/features/workspace/hooks/use-current-workspace";
import { useProjects } from "../hooks/use-projects";
import { useTasksBySpace, useTasksByProject } from "../hooks/use-tasks";
import { ProjectBoard } from "../components/project-board";
import { Task, TaskStatus, TaskPriority } from "../types";

export function TasksPage() {
  const { t } = useTranslation();
  const { spaceId, projectId } = useParams<{
    spaceId: string;
    projectId?: string;
  }>();
  const { data: spaceData } = useCurrentSpace();
  const { data: workspaceData } = useCurrentWorkspace();
  const location = useLocation();
  const navigate = useNavigate();

  // Parse URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const filterType = queryParams.get("filter");
  const filterValue = queryParams.get("value");

  // Get project data if a projectId is provided
  const { data: projectsData } = useProjects({
    spaceId: spaceId || "",
  });

  const projectData =
    projectId && projectsData?.items?.find((p) => p.id === projectId);

  // Get tasks based on spaceId or projectId
  const { data: spaceTasksData, isLoading: isSpaceTasksLoading } =
    useTasksBySpace({
      spaceId: spaceId || "",
    });

  const { data: projectTasksData, isLoading: isProjectTasksLoading } =
    useTasksByProject({
      projectId: projectId || "",
    });

  // Combine tasks data based on source
  const tasksData = projectId ? projectTasksData : spaceTasksData;
  const isLoading = projectId ? isProjectTasksLoading : isSpaceTasksLoading;

  // Create state to store filtered tasks
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  // Update filtered tasks when tasksData or filter parameters change
  useEffect(() => {
    if (!tasksData?.items) {
      setFilteredTasks([]);
      return;
    }

    let filtered = [...tasksData.items];

    if (filterType === "all") {
      // No filtering needed
    } else if (filterType === "status" && filterValue) {
      filtered = filtered.filter(
        (task) => task.status === (filterValue as TaskStatus)
      );
    } else if (filterType === "priority" && filterValue) {
      filtered = filtered.filter(
        (task) => task.priority === (filterValue as TaskPriority)
      );
    } else if (filterType === "dueDate") {
      if (filterValue === "overdue") {
        const now = new Date();
        filtered = filtered.filter(
          (task) =>
            task.dueDate &&
            new Date(task.dueDate) < now &&
            task.status !== "done"
        );
      } else if (filterValue === "upcoming") {
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);

        filtered = filtered.filter(
          (task) =>
            task.dueDate &&
            new Date(task.dueDate) > now &&
            new Date(task.dueDate) <= sevenDaysFromNow &&
            task.status !== "done"
        );
      }
    }

    setFilteredTasks(filtered);
  }, [tasksData, filterType, filterValue]);

  if (!spaceId || !spaceData || !workspaceData) {
    return (
      <Container my="xl">
        <Text>{t("Loading...")}</Text>
      </Container>
    );
  }

  // Generate page title based on filters
  const getPageTitle = () => {
    if (filterType === "all") {
      return t("All Tasks");
    } else if (filterType === "status") {
      if (filterValue === "done") return t("Completed Tasks");
      if (filterValue === "in_progress") return t("In-Progress Tasks");
      if (filterValue === "blocked") return t("Blocked Tasks");
      if (filterValue === "todo") return t("To-Do Tasks");
      if (filterValue === "in_review") return t("In-Review Tasks");
    } else if (filterType === "priority") {
      if (filterValue === "high") return t("High Priority Tasks");
      if (filterValue === "urgent") return t("Urgent Tasks");
      if (filterValue === "medium") return t("Medium Priority Tasks");
      if (filterValue === "low") return t("Low Priority Tasks");
    } else if (filterType === "dueDate") {
      if (filterValue === "overdue") return t("Overdue Tasks");
      if (filterValue === "upcoming") return t("Upcoming Tasks");
    }

    return projectId
      ? projectData?.name || t("Project Tasks")
      : t("Space Tasks");
  };

  const renderBreadcrumbs = () => {
    const items = [
      { title: workspaceData.name, href: "/dashboard" },
      { title: spaceData.name, href: `/spaces/${spaceId}` },
      { title: t("Projects"), href: `/spaces/${spaceId}/projects` },
    ];

    if (projectId && projectData) {
      items.push({
        title: projectData.name,
        href: `/spaces/${spaceId}/projects?projectId=${projectId}`,
      });
    }

    items.push({ title: getPageTitle(), href: "#" });

    return (
      <Breadcrumbs mb="md">
        {items.map((item, index) => (
          <Anchor
            key={index}
            href={item.href}
            onClick={(e) => {
              e.preventDefault();
              if (item.href !== "#") {
                navigate(item.href);
              }
            }}
          >
            {item.title}
          </Anchor>
        ))}
      </Breadcrumbs>
    );
  };

  const handleBackToDashboard = () => {
    navigate(`/spaces/${spaceId}/projects`);
  };

  return (
    <Container size="xl" my="xl">
      {renderBreadcrumbs()}

      <Box>
        <Group justify="space-between" mb="md">
          <Title order={3}>{getPageTitle()}</Title>
          <Button onClick={handleBackToDashboard}>
            {t("Back to Dashboard")}
          </Button>
        </Group>

        {isLoading ? (
          <Card p="xl" withBorder>
            <Stack align="center" py="xl">
              <Loader size="md" />
              <Text>{t("Loading tasks...")}</Text>
            </Stack>
          </Card>
        ) : filteredTasks.length === 0 ? (
          <Card p="xl" withBorder>
            <Text ta="center" py="xl">
              {t("No tasks match the selected filters")}
            </Text>
          </Card>
        ) : (
          <Card p="md" withBorder>
            <Text size="sm" mb="md">
              {t("Showing {{count}} tasks", { count: filteredTasks.length })}
            </Text>

            {/* Task list goes here */}
            <Stack>
              {filteredTasks.map((task) => (
                <Card key={task.id} p="sm" withBorder>
                  <Group justify="space-between">
                    <Text fw={500}>{task.title}</Text>
                    <Text size="xs" c="dimmed">
                      {task.status.toUpperCase()}
                    </Text>
                  </Group>
                  {task.description && (
                    <Text size="sm" lineClamp={2} mt="xs">
                      {task.description}
                    </Text>
                  )}
                </Card>
              ))}
            </Stack>
          </Card>
        )}
      </Box>
    </Container>
  );
}
