import { useState, useEffect } from "react";
import {
  Drawer,
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
  Divider,
  UnstyledButton,
  Menu,
  Badge,
  Avatar,
  Title,
  rem,
  useMantineTheme,
} from "@mantine/core";
import { Task, TaskPriority, TaskStatus } from "../types";
import { useTranslation } from "react-i18next";
import {
  IconChevronLeft,
  IconCheck,
  IconMaximize,
  IconMinimize,
  IconUserCircle,
  IconX,
  IconArrowsExchange,
  IconCalendar,
  IconTag,
  IconListDetails,
  IconEdit,
  IconExternalLink,
} from "@tabler/icons-react";
import {
  useUpdateTaskMutation,
  useAssignTaskMutation,
  useCompleteTaskMutation,
  useTask,
} from "../hooks/use-tasks";
import { UserSelect } from "@/features/user/components/user-select";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "@mantine/form";

interface TaskDrawerProps {
  taskId?: string | null;
  opened: boolean;
  onClose: () => void;
  spaceId: string;
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

const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case "low":
      return "blue";
    case "medium":
      return "yellow";
    case "high":
      return "orange";
    case "urgent":
      return "red";
    default:
      return "gray";
  }
};

export function TaskDrawer({
  taskId,
  opened,
  onClose,
  spaceId,
}: TaskDrawerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  // Use the useTask hook to fetch task data
  const { data: task, isLoading, refetch } = useTask(taskId);

  const updateTaskMutation = useUpdateTaskMutation();
  const assignTaskMutation = useAssignTaskMutation();
  const completeTaskMutation = useCompleteTaskMutation();

  // Update assignee ID when task changes
  useEffect(() => {
    if (task) {
      setAssigneeId(task.assigneeId || null);
    }
  }, [task]);

  // Form for editing task details
  const form = useForm({
    initialValues: {
      title: task?.title || "",
      description: task?.description || "",
      status: task?.status || "todo",
      priority: task?.priority || "medium",
      dueDate: task?.dueDate ? new Date(task.dueDate) : null,
    },
  });

  // Update form when task changes
  useEffect(() => {
    if (task) {
      form.setValues({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
      });
    }
  }, [task]);

  // Handle form submission
  const handleSubmit = form.onSubmit((values) => {
    if (!task) return;

    updateTaskMutation.mutate(
      {
        taskId: task.id,
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate,
      },
      {
        onSuccess: () => {
          refetch();
          setIsEditingTitle(false);
          setIsEditingDescription(false);
        },
      }
    );
  });

  // Handle status change
  const handleStatusChange = (status: string) => {
    if (!task) return;

    updateTaskMutation.mutate(
      {
        taskId: task.id,
        status: status as TaskStatus,
      },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  // Handle priority change
  const handlePriorityChange = (priority: string) => {
    if (!task) return;

    updateTaskMutation.mutate(
      {
        taskId: task.id,
        priority: priority as TaskPriority,
      },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  // Handle assignee change
  const handleAssigneeChange = (userId: string) => {
    if (!task) return;
    setAssigneeId(userId);

    assignTaskMutation.mutate(
      {
        taskId: task.id,
        assigneeId: userId,
      },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  // Handle completion toggle
  const handleCompletionToggle = () => {
    if (!task) return;

    completeTaskMutation.mutate(
      {
        taskId: task.id,
        isCompleted: !task.isCompleted,
      },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  // Open task as full page
  const openAsFullPage = () => {
    if (!task || !task.pageId) return;

    // If we have a page link in the description, extract it
    const pageUrlMatch = task.description?.match(
      /\[View page details\]\(([^)]+)\)/
    );
    if (pageUrlMatch && pageUrlMatch[1]) {
      // Close the drawer before navigating
      onClose();
      navigate(pageUrlMatch[1]);
    }
  };

  // Toggle fullscreen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Clear assignee
  const clearAssignee = () => {
    if (!task) return;
    setAssigneeId(null);

    assignTaskMutation.mutate(
      {
        taskId: task.id,
        assigneeId: null,
      },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  if (isLoading || !task) {
    // Loading state
    return (
      <Drawer
        opened={opened}
        onClose={onClose}
        size={isFullScreen ? "100%" : "xl"}
        title={t("Task Details")}
        position="right"
      >
        <Box
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
          }}
        >
          <Text>{t("Loading task...")}</Text>
        </Box>
      </Drawer>
    );
  }

  return (
    <Drawer
      opened={opened && !!task}
      onClose={onClose}
      size={isFullScreen ? "100%" : "xl"}
      position="right"
      styles={{
        header: {
          padding: theme.spacing.md,
        },
        body: {
          padding: 0,
        },
      }}
      title={
        <Group gap="xs">
          <ActionIcon variant="subtle" onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </ActionIcon>
          <Text fw={500}>{t("Task")}</Text>
        </Group>
      }
      closeButtonProps={{ display: "none" }}
    >
      {task && (
        <Box p="md">
          <Stack gap="lg">
            {/* Top bar with full screen toggle */}
            <Group justify="space-between">
              <Group gap="sm">
                <ActionIcon
                  variant="outline"
                  color={task.status === "done" ? "teal" : "gray"}
                  radius="xl"
                  onClick={handleCompletionToggle}
                >
                  {task.status === "done" ? <IconCheck size={16} /> : <div />}
                </ActionIcon>

                {task.pageId && (
                  <Button
                    variant="light"
                    size="xs"
                    onClick={openAsFullPage}
                    leftSection={<IconExternalLink size={14} />}
                  >
                    {t("Open as page")}
                  </Button>
                )}
              </Group>

              <ActionIcon
                variant="subtle"
                onClick={toggleFullScreen}
                aria-label="Toggle full screen"
              >
                {isFullScreen ? (
                  <IconMinimize size={18} />
                ) : (
                  <IconMaximize size={18} />
                )}
              </ActionIcon>
            </Group>

            {/* Task title */}
            <div>
              {isEditingTitle ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                >
                  <TextInput
                    size="lg"
                    placeholder={t("Task title")}
                    {...form.getInputProps("title")}
                    autoFocus
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSubmit();
                      } else if (e.key === "Escape") {
                        form.setFieldValue("title", task.title);
                        setIsEditingTitle(false);
                      }
                    }}
                  />
                </form>
              ) : (
                <Title
                  order={2}
                  style={{ cursor: "pointer" }}
                  onClick={() => setIsEditingTitle(true)}
                >
                  {task.title}
                </Title>
              )}
            </div>

            {/* Task properties */}
            <Group align="start" gap="lg">
              <Stack gap="md" style={{ flex: 1 }}>
                {/* Status dropdown */}
                <Box>
                  <Text size="sm" fw={500} mb={5}>
                    {t("Status")}
                  </Text>
                  <Select
                    data={STATUS_OPTIONS}
                    value={task.status}
                    onChange={handleStatusChange}
                    size="sm"
                  />
                </Box>

                {/* Priority dropdown */}
                <Box>
                  <Text size="sm" fw={500} mb={5}>
                    {t("Priority")}
                  </Text>
                  <Select
                    data={PRIORITY_OPTIONS}
                    value={task.priority}
                    onChange={handlePriorityChange}
                    size="sm"
                  />
                </Box>

                {/* Assignee */}
                <Box>
                  <Flex justify="space-between" align="center" mb={5}>
                    <Text size="sm" fw={500}>
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
                    onChange={handleAssigneeChange}
                    placeholder={t("Assign to...")}
                    leftSection={<IconUserCircle size={16} />}
                  />
                </Box>
              </Stack>

              {/* Description section */}
              <Box style={{ flex: 2 }}>
                <Text size="sm" fw={500} mb={5}>
                  {t("Description")}
                </Text>
                {isEditingDescription ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmit();
                    }}
                  >
                    <Textarea
                      placeholder={t("Add a more detailed description...")}
                      {...form.getInputProps("description")}
                      autoFocus
                      minRows={5}
                      onBlur={() => setIsEditingDescription(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          form.setFieldValue(
                            "description",
                            task.description || ""
                          );
                          setIsEditingDescription(false);
                        }
                      }}
                    />
                    <Group justify="flex-end" mt="xs">
                      <Button
                        variant="subtle"
                        size="xs"
                        onClick={() => setIsEditingDescription(false)}
                      >
                        {t("Cancel")}
                      </Button>
                      <Button size="xs" onClick={() => handleSubmit()}>
                        {t("Save")}
                      </Button>
                    </Group>
                  </form>
                ) : (
                  <Box
                    style={{
                      cursor: "pointer",
                      padding: theme.spacing.sm,
                      borderRadius: theme.radius.sm,
                      minHeight: rem(100),
                      backgroundColor: "var(--mantine-color-gray-0)",
                    }}
                    onClick={() => setIsEditingDescription(true)}
                  >
                    {task.description ? (
                      <Text>{task.description}</Text>
                    ) : (
                      <Text color="dimmed" fs="italic">
                        {t("Add a more detailed description...")}
                      </Text>
                    )}
                  </Box>
                )}
              </Box>
            </Group>

            {/* Comments section placeholder */}
            <Box mt="xl">
              <Divider label={t("Comments")} labelPosition="center" />
              <Box py="md">
                <Textarea placeholder={t("Add a comment...")} minRows={2} />
                <Group justify="flex-end" mt="xs">
                  <Button size="sm">{t("Comment")}</Button>
                </Group>
              </Box>
            </Box>
          </Stack>
        </Box>
      )}
    </Drawer>
  );
}
