import { useState, useEffect } from "react";
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
  Flex,
} from "@mantine/core";
import { ProjectList } from "../components/project-list";
import { ProjectBoard } from "../components/project-board";
import { Project } from "../types";
import { useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrentSpace } from "@/features/space/hooks/use-current-space";
import { useCurrentWorkspace } from "@/features/workspace/hooks/use-current-workspace";
import { Dashboard } from "../components/dashboard/components/Dashboard";
import { DashboardMetrics } from "../components/dashboard/components/DashboardMetrics";
import { DashboardCharts } from "../components/dashboard/components/DashboardCharts";
import { useDashboardData } from "../components/dashboard/dashboard-hooks";
import { DashboardHeader } from "../components/dashboard/components/DashboardHeader";

export function ProjectManagementPage() {
  const { t } = useTranslation();
  const { spaceId } = useParams<{ spaceId: string }>();
  const { data: spaceData } = useCurrentSpace();
  const { data: workspaceData } = useCurrentWorkspace();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDashboard, setShowDashboard] = useState(true);
  const location = useLocation();

  const {
    projects,
    taskStats,
    projectWithMostTasks,
    projectCompletionRates,
    taskDistributionByOwner,
    isLoading,
  } = useDashboardData({ spaceId });

  // Monitor URL for project ID
  useEffect(() => {
    const projectId = new URLSearchParams(location.search).get("projectId");
    if (projectId) {
      // Find project in projects list
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        setSelectedProject(project);
        setShowDashboard(false);
      }
    }
  }, [location.search, projects]);

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

  const renderContent = () => {
    if (selectedProject) {
      return (
        <Box>
          <Group justify="space-between" mb="md">
            <Title order={3}>{selectedProject.name}</Title>
            <Button onClick={handleBackToProjects}>
              {t("Back to Projects")}
            </Button>
          </Group>
          <ProjectBoard
            project={selectedProject}
            onBack={handleBackToProjects}
          />
        </Box>
      );
    }

    if (showDashboard) {
      return (
        <Box p="md">
          <DashboardHeader onCreateProject={() => {}} />
          <Box mt="xl">
            <DashboardMetrics
              taskStats={taskStats}
              projectCount={projects.length}
              spaceId={spaceId}
            />
          </Box>
          <Box mt="xl">
            <DashboardCharts
              projectCompletionRates={projectCompletionRates}
              projectWithMostTasks={projectWithMostTasks}
              taskStats={taskStats}
              taskDistributionByOwner={taskDistributionByOwner || []}
            />
          </Box>
        </Box>
      );
    }

    return (
      <ProjectList
        spaceId={spaceId}
        workspaceId={workspaceData.id}
        onSelectProject={handleSelectProject}
        onShowDashboard={() => setShowDashboard(true)}
      />
    );
  };

  return (
    <>
      <Container size="xl" my="xl">
        {renderBreadcrumbs()}

        {renderContent()}
      </Container>
    </>
  );
}
