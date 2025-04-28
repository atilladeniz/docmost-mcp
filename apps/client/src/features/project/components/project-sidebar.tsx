import React, { useState } from "react";
import {
  ActionIcon,
  Group,
  Text,
  Tooltip,
  UnstyledButton,
  Stack,
  ScrollArea,
  Box,
  Modal,
  Button,
  TextInput,
  Textarea,
} from "@mantine/core";
import {
  IconArrowRight,
  IconChevronRight,
  IconPlus,
  IconDotsVertical,
  IconFolder,
  IconFolderFilled,
} from "@tabler/icons-react";
import { useProjects, useCreateProjectMutation } from "../hooks/use-projects";
import { Project } from "../types";
import { useDisclosure } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { useForm } from "@mantine/form";
import classes from "../../space/components/sidebar/space-sidebar.module.css";

interface ProjectSidebarProps {
  spaceId: string;
  activeProjectId?: string | null;
  onSelectProject: (project: Project) => void;
}

export function ProjectSidebar({
  spaceId,
  activeProjectId,
  onSelectProject,
}: ProjectSidebarProps) {
  const { t } = useTranslation();
  const { data: projectsData, isLoading } = useProjects({ spaceId });

  // Handle both possible structures from the API
  let projects: Project[] = [];
  if (projectsData) {
    if (Array.isArray(projectsData.data)) {
      // Structure: { data: Project[], pagination: {...} }
      projects = projectsData.data;
    } else if (Array.isArray(projectsData.items)) {
      // Structure: { items: Project[], meta: {...} }
      projects = projectsData.items;
    }
  }

  const createProjectMutation = useCreateProjectMutation();
  const [opened, { open, close }] = useDisclosure(false);

  // Debug logging
  console.log("ProjectSidebar - spaceId:", spaceId);
  console.log("ProjectSidebar - projectsData:", projectsData);
  console.log("ProjectSidebar - projects:", projects);

  const form = useForm({
    initialValues: {
      name: "",
      description: "",
    },
    validate: {
      name: (value) => (value.trim().length < 1 ? t("Name is required") : null),
    },
  });

  const handleCreateProject = (values: {
    name: string;
    description: string;
  }) => {
    createProjectMutation.mutate(
      {
        name: values.name,
        description: values.description,
        spaceId,
      },
      {
        onSuccess: () => {
          close();
          form.reset();
        },
      }
    );
  };

  return (
    <>
      <div className={classes.navbar}>
        <div className={classes.section}>
          <Group className={classes.pagesHeader} justify="space-between">
            <Text size="xs" fw={500} c="dimmed">
              {t("Projects")}
            </Text>
            <Tooltip label={t("Create project")} withArrow position="right">
              <ActionIcon
                variant="default"
                size={18}
                onClick={open}
                aria-label={t("Create project")}
              >
                <IconPlus />
              </ActionIcon>
            </Tooltip>
          </Group>

          <ScrollArea h="calc(100vh - 180px)" type="auto" offsetScrollbars>
            <Stack gap="xs" className={classes.pages}>
              {isLoading ? (
                <Text size="sm" c="dimmed">
                  {t("Loading...")}
                </Text>
              ) : projects.length === 0 ? (
                <Text size="sm" c="dimmed">
                  {t("No projects found")}
                </Text>
              ) : (
                projects.map((project) => (
                  <UnstyledButton
                    key={project.id}
                    className={`${classes.menu} ${
                      activeProjectId === project.id ? classes.activeButton : ""
                    }`}
                    onClick={() => onSelectProject(project)}
                  >
                    <div className={classes.menuItemInner}>
                      {activeProjectId === project.id ? (
                        <IconFolderFilled
                          size={16}
                          className={classes.menuItemIcon}
                          stroke={1.5}
                        />
                      ) : (
                        <IconFolder
                          size={16}
                          className={classes.menuItemIcon}
                          stroke={1.5}
                        />
                      )}
                      <Text size="sm" truncate>
                        {project.name}
                      </Text>
                    </div>
                  </UnstyledButton>
                ))
              )}
            </Stack>
          </ScrollArea>
        </div>
      </div>

      {/* New Project Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={t("Create new project")}
        centered
      >
        <form onSubmit={form.onSubmit(handleCreateProject)}>
          <TextInput
            label={t("Project name")}
            placeholder={t("Enter project name")}
            required
            mb="md"
            {...form.getInputProps("name")}
          />
          <Textarea
            label={t("Description")}
            placeholder={t("Enter project description")}
            mb="xl"
            {...form.getInputProps("description")}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              {t("Cancel")}
            </Button>
            <Button type="submit" loading={createProjectMutation.isPending}>
              {t("Create")}
            </Button>
          </Group>
        </form>
      </Modal>
    </>
  );
}
