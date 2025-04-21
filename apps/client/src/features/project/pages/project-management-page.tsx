import { useState } from "react";
import {
  Box,
  Container,
  Group,
  Paper,
  Title,
  Text,
  Breadcrumbs,
  Anchor,
} from "@mantine/core";
import { ProjectList } from "../components/project-list";
import { ProjectBoard } from "../components/project-board";
import { Project } from "../types";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrentSpace } from "@/features/space/hooks/use-current-space";
import { useCurrentWorkspace } from "@/features/workspace/hooks/use-current-workspace";

export function ProjectManagementPage() {
  const { t } = useTranslation();
  const { spaceId } = useParams<{ spaceId: string }>();
  const { data: spaceData } = useCurrentSpace();
  const { data: workspaceData } = useCurrentWorkspace();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  if (!spaceId || !spaceData || !workspaceData) {
    return (
      <Container my="xl">
        <Text>{t("Loading...")}</Text>
      </Container>
    );
  }

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
  };

  const renderBreadcrumbs = () => {
    const items = [
      { title: workspaceData.name, href: "/dashboard" },
      { title: spaceData.name, href: `/spaces/${spaceId}` },
      { title: t("Projects"), href: `/spaces/${spaceId}/projects` },
    ];

    if (selectedProject) {
      items.push({ title: selectedProject.name, href: "#" });
    }

    return (
      <Breadcrumbs mb="md">
        {items.map((item, index) => (
          <Anchor
            key={index}
            href={item.href}
            onClick={(e) => {
              if (index === items.length - 1) {
                e.preventDefault();
              }
            }}
          >
            {item.title}
          </Anchor>
        ))}
      </Breadcrumbs>
    );
  };

  return (
    <Container size="xl" my="xl">
      {renderBreadcrumbs()}

      <Paper p="md" withBorder>
        {selectedProject ? (
          <ProjectBoard
            project={selectedProject}
            onBack={handleBackToProjects}
          />
        ) : (
          <ProjectList
            spaceId={spaceId}
            workspaceId={workspaceData.id}
            onSelectProject={handleSelectProject}
          />
        )}
      </Paper>
    </Container>
  );
}
