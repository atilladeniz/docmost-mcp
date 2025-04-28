import { useEffect, useState } from "react";
import {
  Box,
  Group,
  Title,
  Text,
  Stack,
  Paper,
  Divider,
  Button,
  Flex,
  Badge,
  ActionIcon,
  Card,
  LoadingOverlay,
  Menu,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import {
  IconArrowLeft,
  IconDots,
  IconEdit,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import {
  useProject,
  useArchiveProjectMutation,
  useDeleteProjectMutation,
} from "../hooks/use-projects";
import { Project, Task } from "../types";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import { ProjectTree } from "./project-tree";
import { useTask } from "../hooks/use-tasks";
import { formatDate } from "@/lib/utils/format-utils";

interface ProjectDetailProps {
  projectId: string;
  spaceId: string;
  onBack: () => void;
}

export function ProjectDetail({
  projectId,
  spaceId,
  onBack,
}: ProjectDetailProps) {
  const { t } = useTranslation();
  const { data: project, isLoading } = useProject(projectId);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { data: selectedTask } = useTask(selectedTaskId || "");
  const archiveProjectMutation = useArchiveProjectMutation();
  const deleteProjectMutation = useDeleteProjectMutation();
  const navigate = useNavigate();

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleArchiveProject = () => {
    if (!project) return;

    archiveProjectMutation.mutate(
      { projectId: project.id, isArchived: !project.isArchived },
      {
        onSuccess: () => {
          notifications.show({
            title: project.isArchived
              ? t("Project unarchived")
              : t("Project archived"),
            message: project.isArchived
              ? t("The project has been unarchived")
              : t("The project has been archived"),
            color: "green",
          });
        },
      }
    );
  };

  const handleDeleteProject = () => {
    if (!project) return;

    if (window.confirm(t("Are you sure you want to delete this project?"))) {
      deleteProjectMutation.mutate(
        { projectId: project.id, projectName: project.name },
        {
          onSuccess: () => {
            notifications.show({
              title: t("Project deleted"),
              message: t("The project has been deleted"),
              color: "green",
            });
            onBack();
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <Box pos="relative" h="100%">
        <LoadingOverlay visible />
      </Box>
    );
  }

  if (!project) {
    return (
      <Stack align="center" justify="center" h="100%">
        <Text>{t("Project not found")}</Text>
        <Button onClick={onBack}>{t("Go back")}</Button>
      </Stack>
    );
  }

  return (
    <Box>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <ActionIcon variant="subtle" onClick={onBack}>
              <IconArrowLeft size={18} />
            </ActionIcon>
            <Title order={2}>{project.name}</Title>
            {project.isArchived && <Badge color="gray">{t("Archived")}</Badge>}
          </Group>

          <Menu position="bottom-end" shadow="md">
            <Menu.Target>
              <ActionIcon>
                <IconDots size={18} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={14} />}>
                {t("Edit project")}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconPlus size={14} />}
                onClick={() => {}}
              >
                {t("Add task")}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconEdit size={14} />}
                onClick={handleArchiveProject}
              >
                {project.isArchived
                  ? t("Unarchive project")
                  : t("Archive project")}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconTrash size={14} />}
                color="red"
                onClick={handleDeleteProject}
              >
                {t("Delete project")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        {/* Project Info */}
        <Paper p="md" withBorder>
          <Stack gap="xs">
            {project.description && (
              <Text size="sm">{project.description}</Text>
            )}
            <Group gap="xl">
              {project.startDate && (
                <Text size="sm" color="dimmed">
                  {t("Start Date")}: {formatDate(new Date(project.startDate))}
                </Text>
              )}
              {project.endDate && (
                <Text size="sm" color="dimmed">
                  {t("End Date")}: {formatDate(new Date(project.endDate))}
                </Text>
              )}
              {project.creator && (
                <Text size="sm" color="dimmed">
                  {t("Created by")}: {project.creator.name}
                </Text>
              )}
            </Group>
          </Stack>
        </Paper>

        {/* Task Tree and Task Detail */}
        <Flex gap="md">
          {/* Task Tree */}
          <Box w={350} h="calc(100vh - 320px)">
            <Card withBorder h="100%">
              <Card.Section withBorder inheritPadding py="xs">
                <Group justify="space-between">
                  <Title order={4}>{t("Tasks")}</Title>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPlus size={14} />}
                  >
                    {t("Add")}
                  </Button>
                </Group>
              </Card.Section>
              <Box h="calc(100% - 50px)" pt="sm">
                <ProjectTree
                  projectId={project.id}
                  spaceId={spaceId}
                  onTaskSelect={handleTaskSelect}
                />
              </Box>
            </Card>
          </Box>

          {/* Task Detail */}
          <Box flex={1} h="calc(100vh - 320px)">
            <Card withBorder h="100%">
              {selectedTask ? (
                <>
                  <Card.Section withBorder inheritPadding py="xs">
                    <Group justify="space-between">
                      <Title order={4}>{selectedTask.title}</Title>
                      <Badge
                        color={
                          selectedTask.status === "done"
                            ? "green"
                            : selectedTask.status === "in_progress"
                              ? "blue"
                              : selectedTask.status === "blocked"
                                ? "red"
                                : "gray"
                        }
                      >
                        {selectedTask.status}
                      </Badge>
                    </Group>
                  </Card.Section>
                  <Stack gap="md" p="md">
                    {selectedTask.description && (
                      <>
                        <Text fw={500}>{t("Description")}</Text>
                        <Text size="sm">{selectedTask.description}</Text>
                        <Divider />
                      </>
                    )}

                    <Group>
                      <Stack gap={5}>
                        <Text fw={500} size="sm">
                          {t("Priority")}
                        </Text>
                        <Badge
                          color={
                            selectedTask.priority === "urgent"
                              ? "red"
                              : selectedTask.priority === "high"
                                ? "orange"
                                : selectedTask.priority === "medium"
                                  ? "yellow"
                                  : "blue"
                          }
                        >
                          {selectedTask.priority}
                        </Badge>
                      </Stack>

                      {selectedTask.dueDate && (
                        <Stack gap={5}>
                          <Text fw={500} size="sm">
                            {t("Due Date")}
                          </Text>
                          <Text size="sm">
                            {formatDate(new Date(selectedTask.dueDate))}
                          </Text>
                        </Stack>
                      )}

                      {selectedTask.assignee && (
                        <Stack gap={5}>
                          <Text fw={500} size="sm">
                            {t("Assignee")}
                          </Text>
                          <Text size="sm">{selectedTask.assignee.name}</Text>
                        </Stack>
                      )}
                    </Group>
                  </Stack>
                </>
              ) : (
                <Stack gap="md" align="center" justify="center" h="100%">
                  <Text color="dimmed">
                    {t("Select a task to view details")}
                  </Text>
                </Stack>
              )}
            </Card>
          </Box>
        </Flex>
      </Stack>
    </Box>
  );
}
