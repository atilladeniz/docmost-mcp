import { Box, Paper, Group, Badge, Text, Stack, Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableTask } from "../../../components/sortable-task";
import { Task, TaskStatus } from "../../../types";
import { useTranslation } from "react-i18next";
import { getStatusLabel } from "../board-utils";

interface BoardColumnProps {
  status: TaskStatus;
  tasks: Task[];
  users: any[]; // Replace with proper user type
  onCreateTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
}

export function BoardColumn({
  status,
  tasks,
  users,
  onCreateTask,
  onEditTask,
}: BoardColumnProps) {
  const { t } = useTranslation();

  return (
    <Box style={{ minWidth: 280 }}>
      <Paper
        id={`status-${status}`}
        withBorder
        p="md"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Group justify="space-between" mb="sm">
          <Badge size="lg" variant="light">
            {t(getStatusLabel(status))}
          </Badge>
          <Text size="sm" c="dimmed">
            {tasks.length}
          </Text>
        </Group>

        <Stack gap="xs" style={{ flex: 1, minHeight: 200 }}>
          <SortableContext
            items={tasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <SortableTask
                key={task.id}
                id={task.id}
                task={task}
                onClick={() => onEditTask(task)}
                users={users}
              />
            ))}
          </SortableContext>
        </Stack>

        <Button
          leftSection={<IconPlus size={16} />}
          variant="subtle"
          fullWidth
          mt="md"
          onClick={() => onCreateTask(status)}
        >
          {t("Add Task")}
        </Button>
      </Paper>
    </Box>
  );
}
