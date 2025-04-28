import {
  Grid,
  Card,
  Text,
  Stack,
  Group,
  Progress,
  SimpleGrid,
  RingProgress,
  Title,
  Badge,
  useMantineTheme,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Project } from "../../../types";

interface ProjectCompletion {
  project: Project;
  totalCount: number;
  completedCount: number;
  completionRate: number;
}

interface MostActiveProject {
  project: Project | null;
  taskCount: number;
}

interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  highPriorityTasks: number;
  dueSoonTasks: number;
  overdueTasks: number;
  tasksWithDueDate: number;
  completionRate: number;
}

interface DashboardChartsProps {
  projectCompletionRates: ProjectCompletion[];
  projectWithMostTasks: MostActiveProject | null;
  taskStats: TaskStats;
}

export function DashboardCharts({
  projectCompletionRates,
  projectWithMostTasks,
  taskStats,
}: DashboardChartsProps) {
  const { t } = useTranslation();
  const theme = useMantineTheme();

  return (
    <>
      <Title order={3} mt="lg">
        {t("Project Overview")}
      </Title>

      {/* Project completion rates */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder p="md" radius="md">
            <Text fw={500} size="lg" mb="md">
              {t("Project Completion Status")}
            </Text>
            {projectCompletionRates.length === 0 ? (
              <Text size="sm" c="dimmed">
                {t("No projects to display")}
              </Text>
            ) : (
              <Stack gap="xs">
                {projectCompletionRates
                  .slice(0, 5)
                  .map(
                    ({
                      project,
                      totalCount,
                      completedCount,
                      completionRate,
                    }) => (
                      <div key={project.id}>
                        <Group justify="space-between" mb={5}>
                          <Group>
                            <Text size="sm" fw={500}>
                              {project.name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              ({completedCount}/{totalCount} {t("tasks")})
                            </Text>
                          </Group>
                          <Text size="xs" fw={700}>
                            {completionRate.toFixed(0)}%
                          </Text>
                        </Group>
                        <Progress
                          value={completionRate}
                          size="sm"
                          color={
                            completionRate > 75
                              ? "green"
                              : completionRate > 50
                                ? "cyan"
                                : completionRate > 25
                                  ? "yellow"
                                  : "red"
                          }
                        />
                      </div>
                    )
                  )}
              </Stack>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder p="md" radius="md" h="100%">
            <Text fw={500} size="lg" mb="md">
              {t("Most Active Project")}
            </Text>
            {projectWithMostTasks && projectWithMostTasks.project ? (
              <Stack justify="center" h="80%">
                <Title
                  order={3}
                  ta="center"
                  style={{ wordBreak: "break-word" }}
                >
                  {projectWithMostTasks.project.name}
                </Title>
                <Group justify="center">
                  <Badge size="lg">
                    {projectWithMostTasks.taskCount} {t("tasks")}
                  </Badge>
                </Group>
              </Stack>
            ) : (
              <Text size="sm" c="dimmed" ta="center">
                {t("No projects with tasks")}
              </Text>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* Task distribution */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mt="md">
        <Card withBorder p="md" radius="md">
          <Text fw={500} size="lg" mb="md">
            {t("Task Status Distribution")}
          </Text>
          <Group justify="space-between" grow mt="md">
            <Stack align="center">
              <RingProgress
                size={80}
                roundCaps
                thickness={8}
                sections={[
                  {
                    value:
                      (taskStats.inProgressTasks / taskStats.totalTasks) *
                        100 || 0,
                    color: theme.colors.blue[6],
                  },
                ]}
                label={
                  <Text fw={700} ta="center" size="lg">
                    {taskStats.inProgressTasks}
                  </Text>
                }
              />
              <Text size="xs" c="dimmed" ta="center">
                {t("In Progress")}
              </Text>
            </Stack>

            <Stack align="center">
              <RingProgress
                size={80}
                roundCaps
                thickness={8}
                sections={[
                  {
                    value:
                      (taskStats.completedTasks / taskStats.totalTasks) * 100 ||
                      0,
                    color: theme.colors.green[6],
                  },
                ]}
                label={
                  <Text fw={700} ta="center" size="lg">
                    {taskStats.completedTasks}
                  </Text>
                }
              />
              <Text size="xs" c="dimmed" ta="center">
                {t("Completed")}
              </Text>
            </Stack>

            <Stack align="center">
              <RingProgress
                size={80}
                roundCaps
                thickness={8}
                sections={[
                  {
                    value:
                      (taskStats.blockedTasks / taskStats.totalTasks) * 100 ||
                      0,
                    color: theme.colors.red[6],
                  },
                ]}
                label={
                  <Text fw={700} ta="center" size="lg">
                    {taskStats.blockedTasks}
                  </Text>
                }
              />
              <Text size="xs" c="dimmed" ta="center">
                {t("Blocked")}
              </Text>
            </Stack>
          </Group>
        </Card>

        <Card withBorder p="md" radius="md">
          <Text fw={500} size="lg" mb="md">
            {t("Deadline Status")}
          </Text>
          <Group justify="space-between" grow mt="md">
            <Stack align="center">
              <RingProgress
                size={80}
                roundCaps
                thickness={8}
                sections={[
                  {
                    value:
                      (taskStats.overdueTasks / taskStats.tasksWithDueDate) *
                        100 || 0,
                    color: theme.colors.red[6],
                  },
                ]}
                label={
                  <Text fw={700} ta="center" size="lg">
                    {taskStats.overdueTasks}
                  </Text>
                }
              />
              <Text size="xs" c="dimmed" ta="center">
                {t("Overdue")}
              </Text>
            </Stack>

            <Stack align="center">
              <RingProgress
                size={80}
                roundCaps
                thickness={8}
                sections={[
                  {
                    value:
                      (taskStats.dueSoonTasks / taskStats.tasksWithDueDate) *
                        100 || 0,
                    color: theme.colors.yellow[6],
                  },
                ]}
                label={
                  <Text fw={700} ta="center" size="lg">
                    {taskStats.dueSoonTasks}
                  </Text>
                }
              />
              <Text size="xs" c="dimmed" ta="center">
                {t("Due Soon")}
              </Text>
            </Stack>

            <Stack align="center">
              <RingProgress
                size={80}
                roundCaps
                thickness={8}
                sections={[
                  {
                    value:
                      ((taskStats.tasksWithDueDate -
                        taskStats.overdueTasks -
                        taskStats.dueSoonTasks) /
                        taskStats.tasksWithDueDate) *
                        100 || 0,
                    color: theme.colors.green[6],
                  },
                ]}
                label={
                  <Text fw={700} ta="center" size="lg">
                    {taskStats.tasksWithDueDate -
                      taskStats.overdueTasks -
                      taskStats.dueSoonTasks}
                  </Text>
                }
              />
              <Text size="xs" c="dimmed" ta="center">
                {t("On Track")}
              </Text>
            </Stack>
          </Group>
        </Card>
      </SimpleGrid>
    </>
  );
}
