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
  Button,
} from "@mantine/core";
import { ProjectList } from "../components/project-list";
import { ProjectBoard } from "../components/project-board";
import { Project } from "../types";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrentSpace } from "@/features/space/hooks/use-current-space";
import { useCurrentWorkspace } from "@/features/workspace/hooks/use-current-workspace";
import { ProjectDashboard } from "../components/project-dashboard";

export function ProjectManagementPage() {
  const { t } = useTranslation();
  const { spaceId } = useParams<{ spaceId: string }>();
  const { data: spaceData } = useCurrentSpace();
  const { data: workspaceData } = useCurrentWorkspace();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDashboard, setShowDashboard] = useState(true);

  // Debug logging
  console.log("ProjectManagementPage - spaceId:", spaceId);
  console.log("ProjectManagementPage - spaceData:", spaceData);
  console.log("ProjectManagementPage - workspaceData:", workspaceData);
  console.log("ProjectManagementPage - showDashboard:", showDashboard);

  if (!spaceId || !spaceData || !workspaceData) {
    return (
      <Container my="xl">
        <Text>{t("Loading...")}</Text>
      </Container>
    );
  }

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setShowDashboard(false);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
  };

  const handleToggleDashboard = () => {
    setShowDashboard(!showDashboard);
  };

  const renderBreadcrumbs = () => {
    const items = [
      { title: workspaceData.name, href: "/dashboard" },
      { title: spaceData.name, href: `/spaces/${spaceId}` },
      { title: t("Projects"), href: `/spaces/${spaceId}/projects` },
    ];

    if (selectedProject) {
      items.push({ title: selectedProject.name, href: "#" });
    } else if (!showDashboard) {
      items.push({ title: t("All Projects"), href: "#" });
    } else {
      items.push({ title: t("Dashboard"), href: "#" });
    }

    return (
      <Breadcrumbs mb="md">
        {items.map((item, index) => (
          <Anchor
            key={index}
            href={item.href}
            onClick={(e) => {
              e.preventDefault();
              if (index === items.length - 1 && item.title === t("Dashboard")) {
                // Don't do anything if we're already on the dashboard
              } else if (
                index === items.length - 1 &&
                item.title === t("All Projects")
              ) {
                setShowDashboard(true);
              } else if (
                index === items.length - 2 &&
                items[items.length - 1].title !== t("Dashboard")
              ) {
                setSelectedProject(null);
                setShowDashboard(false);
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

      {/* Debug buttons for testing */}
      <Group mb="md">
        <Button
          variant={showDashboard ? "filled" : "outline"}
          onClick={() => setShowDashboard(true)}
        >
          Show Dashboard
        </Button>
        <Button
          variant={!showDashboard && !selectedProject ? "filled" : "outline"}
          onClick={() => {
            setSelectedProject(null);
            setShowDashboard(false);
          }}
        >
          Show Project List
        </Button>
      </Group>

      <Paper p="md" withBorder>
        <ProjectDashboard
          spaceId={spaceId}
          onSelectProject={handleSelectProject}
        />
      </Paper>
    </Container>
  );
}
