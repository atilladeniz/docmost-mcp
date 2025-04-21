import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Grid,
  Group,
  TextInput,
  Text,
  Badge,
  Menu,
  ActionIcon,
  Loader,
  Flex,
  Title,
  Box,
  Stack,
} from "@mantine/core";
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconArchive,
  IconSearch,
  IconPlus,
  IconArchiveOff,
  IconLayoutDashboard,
} from "@tabler/icons-react";
import {
  useProjects,
  useArchiveProjectMutation,
  useDeleteProjectMutation,
} from "../hooks/use-projects";
import { Project } from "../types";
import { modals } from "@mantine/modals";
import { useTranslation } from "react-i18next";
import { useDisclosure } from "@mantine/hooks";
import ProjectFormModal from "./project-form-modal";

interface ProjectListProps {
  spaceId: string;
  workspaceId: string;
  onSelectProject: (project: Project) => void;
  onShowDashboard?: () => void;
}

export function ProjectList({
  spaceId,
  workspaceId,
  onSelectProject,
  onShowDashboard,
}: ProjectListProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [
    createModalOpened,
    { open: openCreateModal, close: closeCreateModal },
  ] = useDisclosure(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const { data, isLoading, refetch } = useProjects({
    spaceId,
    includeArchived,
    searchTerm: searchTerm || undefined,
  });

  const archiveProjectMutation = useArchiveProjectMutation();
  const deleteProjectMutation = useDeleteProjectMutation();

  useEffect(() => {
    // Refetch when props change
    refetch();
  }, [spaceId, refetch]);

  const handleOpenEditModal = (project: Project) => {
    setEditingProject(project);
  };

  const handleCloseEditModal = () => {
    setEditingProject(null);
  };

  const handleArchiveProject = (project: Project) => {
    archiveProjectMutation.mutate({
      projectId: project.id,
      isArchived: !project.isArchived,
    });
  };

  const handleDeleteProject = (project: Project) => {
    modals.openConfirmModal({
      title: t("Delete project"),
      children: (
        <Text size="sm">
          {t(
            'Are you sure you want to delete project "{name}"? This action cannot be undone.',
            { name: project.name }
          )}
        </Text>
      ),
      labels: { confirm: t("Delete"), cancel: t("Cancel") },
      confirmProps: { color: "red" },
      onConfirm: () => deleteProjectMutation.mutate(project.id),
    });
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Loader />
      </Flex>
    );
  }

  const projects = data?.items || [];

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={3}>{t("Projects")}</Title>
          <Group>
            {onShowDashboard && (
              <Button
                leftSection={<IconLayoutDashboard size={16} />}
                variant="light"
                onClick={onShowDashboard}
              >
                {t("Dashboard")}
              </Button>
            )}
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={openCreateModal}
            >
              {t("New Project")}
            </Button>
          </Group>
        </Group>

        <Group>
          <TextInput
            placeholder={t("Search projects...")}
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            style={{ flexGrow: 1 }}
          />
          <Button
            variant={includeArchived ? "filled" : "outline"}
            onClick={() => setIncludeArchived(!includeArchived)}
          >
            {includeArchived ? t("Hide Archived") : t("Show Archived")}
          </Button>
        </Group>

        {projects.length === 0 ? (
          <Box py="xl">
            <Text ta="center" c="dimmed">
              {searchTerm
                ? t("No projects found for your search")
                : includeArchived
                  ? t("No projects found")
                  : t("No active projects found")}
            </Text>
          </Box>
        ) : (
          <Grid>
            {projects.map((project) => (
              <Grid.Col key={project.id} span={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card
                  shadow="sm"
                  p="lg"
                  radius="md"
                  withBorder
                  style={{
                    cursor: "pointer",
                    opacity: project.isArchived ? 0.7 : 1,
                    position: "relative",
                  }}
                  onClick={() => onSelectProject(project)}
                >
                  <Group justify="space-between" mb="xs">
                    <Text fw={500}>
                      {project.icon && (
                        <span style={{ marginRight: 8 }}>{project.icon}</span>
                      )}
                      {project.name}
                    </Text>
                    <Menu withinPortal position="bottom-end" shadow="md">
                      <Menu.Target>
                        <ActionIcon
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEdit size={16} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(project);
                          }}
                        >
                          {t("Edit")}
                        </Menu.Item>
                        <Menu.Item
                          leftSection={
                            project.isArchived ? (
                              <IconArchiveOff size={16} />
                            ) : (
                              <IconArchive size={16} />
                            )
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveProject(project);
                          }}
                        >
                          {project.isArchived ? t("Unarchive") : t("Archive")}
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={16} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project);
                          }}
                        >
                          {t("Delete")}
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>

                  {project.description && (
                    <Text size="sm" color="dimmed" lineClamp={2}>
                      {project.description}
                    </Text>
                  )}

                  {project.isArchived && (
                    <Badge color="gray" mt="xs">
                      {t("Archived")}
                    </Badge>
                  )}
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>

      {/* Project Create Modal */}
      <ProjectFormModal
        opened={createModalOpened}
        onClose={closeCreateModal}
        spaceId={spaceId}
        workspaceId={workspaceId}
      />

      {/* Project Edit Modal */}
      {editingProject && (
        <ProjectFormModal
          opened={!!editingProject}
          onClose={handleCloseEditModal}
          spaceId={spaceId}
          workspaceId={workspaceId}
          project={editingProject}
        />
      )}
    </>
  );
}
