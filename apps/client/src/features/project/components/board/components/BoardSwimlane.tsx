import { Box, Paper, Group, Badge, Text, Button, Flex } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { SortableTask } from "../../../components/sortable-task";
import { Task, TaskStatus } from "../../../types";
import { useTranslation } from "react-i18next";

interface BoardSwimlaneProps {
  id: string;
  title: string;
  tasks: Task[];
  users: any[]; // Replace with proper user type
  onCreateTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  containerId: string;
}

export function BoardSwimlane({
  id,
  title,
  tasks,
  users,
  onCreateTask,
  onEditTask,
  containerId,
}: BoardSwimlaneProps) {
  const { t } = useTranslation();

  return (
    <Paper withBorder p="md">
      <Group justify="space-between" mb="md">
        <Badge size="lg" variant="light">
          {title}
        </Badge>
        <Group>
          <Text size="sm" c="dimmed">
            {tasks.length}
          </Text>
          <Button
            leftSection={<IconPlus size={16} />}
            variant="subtle"
            size="xs"
            onClick={() => onCreateTask("todo")}
          >
            {t("Add Task")}
          </Button>
        </Group>
      </Group>

      <Box
        id={containerId}
        style={{
          minHeight: tasks.length > 0 ? "auto" : 80,
          backgroundColor: "var(--mantine-color-dark-6, #f9f9f9)",
          borderRadius: 8,
          padding: 8,
        }}
        className="project-swimlane-container"
      >
        <SortableContext
          items={tasks.map((task) => task.id)}
          strategy={rectSortingStrategy}
        >
          <Flex gap="md" wrap="wrap">
            {tasks.map((task) => (
              <Box key={task.id} style={{ width: 250 }}>
                <SortableTask
                  id={task.id}
                  task={task}
                  onClick={() => onEditTask(task)}
                  users={users}
                />
              </Box>
            ))}
            {tasks.length === 0 && (
              <Text size="sm" c="dimmed" ta="center" w="100%" py="sm">
                {t("No tasks")}
              </Text>
            )}
          </Flex>
        </SortableContext>
      </Box>
    </Paper>
  );
}
