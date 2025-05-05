import { useEffect, useRef } from "react";
import {
  Modal,
  Button,
  TextInput,
  Textarea,
  Group,
  Stack,
  Select,
  ActionIcon,
  Flex,
  Box,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useAssignTaskMutation,
} from "../hooks/use-tasks";
import { Task, TaskPriority, TaskStatus } from "../types";
import { useTranslation } from "react-i18next";
import { IconSearch, IconUserCircle, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { useSearchUsers } from "@/features/user/hooks/use-search-users";
import { UserSelect } from "@/features/user/components/user-select";

interface TaskFormModalProps {
  opened: boolean;
  onClose: () => void;
  projectId: string;
  spaceId: string;
  task?: Task | null;
}

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function TaskFormModal({
  opened,
  onClose,
  projectId,
  spaceId,
  task,
}: TaskFormModalProps) {
  const { t } = useTranslation();
  const isEditing = !!(task && task.id);
  const [assigneeId, setAssigneeId] = useState<string | null>(
    task?.assigneeId || null
  );
  const formInitializedRef = useRef(false);

  const form = useForm({
    initialValues: {
      title: "",
      description: "",
      status: "todo" as TaskStatus,
      priority: "medium" as TaskPriority,
      dueDate: null as Date | null,
    },
    validate: {
      title: (value) => (value.trim() === "" ? t("Title is required") : null),
    },
  });

  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const assignTaskMutation = useAssignTaskMutation();

  useEffect(() => {
    if (opened && task) {
      form.setValues({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
      });
      setAssigneeId(task.assigneeId || null);
      formInitializedRef.current = true;
    } else if (opened && !task) {
      form.reset();
      setAssigneeId(null);
      formInitializedRef.current = true;
    }

    if (!opened) {
      formInitializedRef.current = false;
    }
  }, [opened, task, form]);

  const handleSubmit = form.onSubmit((values) => {
    if (isEditing && task) {
      updateTaskMutation.mutate(
        {
          taskId: task.id,
          ...values,
        },
        {
          onSuccess: () => {
            if (assigneeId !== task.assigneeId) {
              assignTaskMutation.mutate(
                {
                  taskId: task.id,
                  assigneeId,
                },
                {
                  onSuccess: () => {
                    onClose();
                  },
                }
              );
            } else {
              onClose();
            }
          },
        }
      );
    } else {
      console.log("Creating new task with values:", {
        ...values,
        projectId,
        spaceId,
        assigneeId: assigneeId || undefined,
      });

      if (!projectId) {
        console.error("Error: projectId is missing or invalid", projectId);
      }

      if (!spaceId) {
        console.error("Error: spaceId is missing or invalid", spaceId);
      }

      const validStatus = [
        "todo",
        "in_progress",
        "in_review",
        "done",
        "blocked",
      ].includes(values.status)
        ? values.status
        : "todo";

      createTaskMutation.mutate(
        {
          ...values,
          status: validStatus,
          projectId,
          spaceId,
          assigneeId: assigneeId || undefined,
        },
        {
          onSuccess: (data) => {
            console.log("Task created successfully:", data);
            onClose();
          },
          onError: (error) => {
            console.error("Error creating task:", error);
            try {
              if (error && typeof error === "object" && "response" in error) {
                const errorResponse = error.response as any;
                console.error("Response data:", errorResponse?.data);
                console.error("Response status:", errorResponse?.status);
              }
            } catch (e) {
              console.error("Error parsing error response", e);
            }
          },
        }
      );
    }
  });

  const handleUserSelect = (userId: string) => {
    setAssigneeId(userId);
  };

  const clearAssignee = () => {
    setAssigneeId(null);
  };

  const loading =
    createTaskMutation.isPending ||
    updateTaskMutation.isPending ||
    assignTaskMutation.isPending;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditing ? t("Edit Task") : t("Create New Task")}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            required
            label={t("Task Title")}
            placeholder={t("Enter task title")}
            {...form.getInputProps("title")}
          />

          <Textarea
            label={t("Description")}
            placeholder={t("Enter task description (optional)")}
            minRows={3}
            {...form.getInputProps("description")}
          />

          <Group grow>
            <Select
              label={t("Status")}
              placeholder={t("Select status")}
              data={STATUS_OPTIONS}
              {...form.getInputProps("status")}
            />

            <Select
              label={t("Priority")}
              placeholder={t("Select priority")}
              data={PRIORITY_OPTIONS}
              {...form.getInputProps("priority")}
            />
          </Group>

          <Box>
            <TextInput
              label={t("Due Date")}
              placeholder={t("YYYY-MM-DD")}
              {...form.getInputProps("dueDate")}
            />
          </Box>

          <Box>
            <Flex justify="space-between" align="center" mb={5}>
              <Text fw={500} size="sm">
                {t("Assignee")}
              </Text>
              {assigneeId && (
                <ActionIcon
                  size="xs"
                  onClick={clearAssignee}
                  color="gray"
                  variant="subtle"
                >
                  <IconX size={12} />
                </ActionIcon>
              )}
            </Flex>
            <UserSelect
              value={assigneeId}
              onChange={handleUserSelect}
              placeholder={t("Assign to...")}
              leftSection={<IconUserCircle size={16} />}
            />
          </Box>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              {t("Cancel")}
            </Button>
            <Button type="submit" loading={loading}>
              {isEditing ? t("Update Task") : t("Create Task")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
