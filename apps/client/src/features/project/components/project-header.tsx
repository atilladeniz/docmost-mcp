import { useState, useRef, useEffect } from "react";
import {
  Box,
  Group,
  Title,
  Text,
  Stack,
  Paper,
  Button,
  Flex,
  Badge,
  ActionIcon,
  Image,
  TextInput,
  Textarea,
  Avatar,
  Menu,
  Select,
  MultiSelect,
  Popover,
  Indicator,
  Grid,
  Modal,
  Divider,
  ColorPicker,
  Rating,
  Tooltip,
  useMantineTheme,
  FileInput,
} from "@mantine/core";
import {
  IconCalendar,
  IconEdit,
  IconPhoto,
  IconPlus,
  IconTags,
  IconUsers,
  IconX,
  IconBrandGithub,
  IconFlag,
  IconSubtask,
  IconFolder,
  IconChevronDown,
  IconCheck,
  IconDotsVertical,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { Project, Task, Label, TaskPriority } from "../types";
import { useTranslation } from "react-i18next";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { useUpdateProjectMutation } from "../hooks/use-projects";
import { useWorkspaceUsers } from "@/features/user/hooks/use-workspace-users";

// Check if we're in development mode
const isDevelopment = import.meta.env?.DEV;

// Only log in production or if explicitly enabled
const shouldLog =
  !isDevelopment || import.meta.env?.VITE_ENABLE_LOGS === "true";

// Helper function to conditionally log
const conditionalLog = (message: string, data?: any) => {
  if (shouldLog) {
    console.log(message, data);
  }
};

// Helper function to conditionally log errors
const conditionalErrorLog = (message: string, error?: any) => {
  if (shouldLog || error?.response?.status >= 400) {
    console.error(message, error);
  }
};

interface ProjectHeaderProps {
  project: Project;
  onBack?: () => void;
}

// Define priority options
const priorityOptions = [
  { value: "low", label: "Low", color: "gray" },
  { value: "medium", label: "Medium", color: "blue" },
  { value: "high", label: "High", color: "orange" },
  { value: "urgent", label: "Urgent", color: "red" },
];

export function ProjectHeader({ project, onBack }: ProjectHeaderProps) {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [title, setTitle] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [startDate, setStartDate] = useState<Date | null>(
    project.startDate ? new Date(project.startDate) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    project.endDate ? new Date(project.endDate) : null
  );
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    project.coverImage || null
  );
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const [opened, { open, close }] = useDisclosure(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  // Mutations
  const updateProjectMutation = useUpdateProjectMutation();

  // Get workspace users
  const { data: workspaceUsers = [] } = useWorkspaceUsers({
    workspaceId: project.workspaceId,
  });

  // Ensure workspaceUsers is an array by checking for pagination structure
  const users = Array.isArray(workspaceUsers)
    ? workspaceUsers
    : workspaceUsers &&
        typeof workspaceUsers === "object" &&
        "data" in workspaceUsers
      ? workspaceUsers.data
      : [];

  // Type assertion to help TypeScript understand the structure
  const typedUsers = users as Array<{
    id: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
  }>;

  // Mock data for demo
  const labels: Label[] = [
    {
      id: "1",
      name: "Frontend",
      color: "blue",
      projectId: project.id,
      spaceId: project.spaceId,
      workspaceId: project.workspaceId,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "2",
      name: "Backend",
      color: "green",
      projectId: project.id,
      spaceId: project.spaceId,
      workspaceId: project.workspaceId,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "3",
      name: "Bug",
      color: "red",
      projectId: project.id,
      spaceId: project.spaceId,
      workspaceId: project.workspaceId,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "4",
      name: "Feature",
      color: "violet",
      projectId: project.id,
      spaceId: project.spaceId,
      workspaceId: project.workspaceId,
      createdAt: "",
      updatedAt: "",
    },
  ];

  // Helper to update project
  const updateProject = (data: any) => {
    conditionalLog("Updating project with data:", data);
    // Log the full project details including the ID
    console.log("Project details for debugging:", {
      projectId: project.id,
      projectName: project.name,
      fullProject: project,
      updateData: data,
    });

    updateProjectMutation.mutate(
      {
        projectId: project.id,
        ...data,
      },
      {
        onSuccess: (updatedProject) => {
          conditionalLog("Project updated successfully:", updatedProject);
          notifications.show({
            title: t("Project updated"),
            message: t("The project has been updated successfully"),
            color: "green",
          });
        },
        onError: (error) => {
          conditionalErrorLog("Error updating project:", error);
          notifications.show({
            title: t("Error"),
            message: t("Failed to update project"),
            color: "red",
          });
        },
      }
    );
  };

  // Handle title update
  const handleTitleUpdate = () => {
    conditionalLog("Title update triggered - current title:", {
      title,
      projectName: project.name,
    });
    if (title !== project.name) {
      updateProject({ name: title });
    }
    setIsEditingTitle(false);
  };

  // Handle description update
  const handleDescriptionUpdate = () => {
    if (description !== project.description) {
      updateProject({ description });
    }
    setIsEditingDescription(false);
  };

  // Handle dates update
  const handleDatesUpdate = () => {
    updateProject({
      startDate: startDate,
      endDate: endDate,
    });
  };

  // Focus the input when editing starts
  const focusInput = (
    ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setTimeout(() => {
      if (ref.current) {
        ref.current.focus();
        if ("select" in ref.current) {
          ref.current.select();
        }
      }
    }, 0);
  };

  // Process image URL function
  const processImageUrl = async (url: string) => {
    if (!url) return;

    // Show loading notification
    notifications.show({
      id: "validate-image-url",
      title: t("Validating image URL"),
      message: t("Please wait while we validate the image URL..."),
      color: "blue",
      loading: true,
    });

    try {
      // Check if the URL is valid by loading the image
      const isValid = await new Promise<boolean>((resolve) => {
        const img = document.createElement("img");
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
      });

      if (isValid) {
        // Update UI
        setCoverImageUrl(url);

        // Save to database
        updateProject({ coverImage: url });

        // Success notification
        notifications.show({
          id: "validate-image-url",
          title: t("Image URL validated"),
          message: t("The image URL has been set as your cover image"),
          color: "green",
        });

        // Close the modal
        close();
      } else {
        throw new Error("Invalid image URL");
      }
    } catch (error) {
      // Error notification
      notifications.show({
        id: "validate-image-url",
        title: t("Error"),
        message: t("The provided URL is not a valid image"),
        color: "red",
      });
    }
  };

  // Clean up when modal closes
  const handleModalClose = () => {
    // Only revoke if we're not using the image
    if (objectUrl && !coverImageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }
    close();
  };

  // Upload file to server
  const uploadFileToServer = async (file: File) => {
    try {
      // Create a FormData instance
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", project.id);

      // Show loading notification
      const loadingId = notifications.show({
        loading: true,
        title: t("Uploading image"),
        message: t("Please wait while we upload your image"),
        autoClose: false,
        withCloseButton: false,
      });

      // In a real implementation, you would use your API client to upload the file
      // For example:
      // const response = await api.post('/upload', formData);
      // const imageUrl = response.data.url;

      // For now, we'll simulate a successful upload with the object URL
      await new Promise<void>((resolve) => setTimeout(resolve, 1500)); // Simulate network delay

      // Success notification
      notifications.show({
        id: loadingId,
        color: "green",
        title: t("Upload complete"),
        message: t("The image has been uploaded successfully"),
        icon: <IconCheck size={16} />,
        loading: false,
        autoClose: 3000,
      });

      // For now, we'll use a placeholder image URL for demonstration
      const imageUrl = "https://picsum.photos/1000/300";
      setCoverImageUrl(imageUrl);

      // In a real app, you would update the project with the new image URL from the server
      updateProject({ coverImage: imageUrl });

      handleModalClose();
    } catch (error) {
      // Error notification
      notifications.show({
        color: "red",
        title: t("Upload failed"),
        message: t("There was a problem uploading your image"),
        icon: <IconX size={16} />,
      });
      console.error("Error uploading file:", error);
    }
  };

  // Handle file upload
  const handleFileUpload = (file: File | null) => {
    if (file) {
      setCoverImageFile(file);

      // Clean up previous object URL if it exists
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      // Create a local object URL for preview
      const newObjectUrl = URL.createObjectURL(file);
      setObjectUrl(newObjectUrl);
      setCoverImageUrl(newObjectUrl);

      // Upload the file
      uploadFileToServer(file);
    } else {
      // If file is cleared, also clear the object URL
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        setObjectUrl(null);
      }
      // Only clear the URL if it's an object URL (not an external URL)
      if (coverImageUrl && coverImageUrl.startsWith("blob:")) {
        setCoverImageUrl(null);
      }
    }
  };

  // Handle removing the cover image
  const handleRemoveCoverImage = () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }
    setCoverImageUrl(null);
    setCoverImageFile(null);

    // Save the change to the database
    updateProject({ coverImage: null });

    // Success notification
    notifications.show({
      title: t("Cover image removed"),
      message: t("The cover image has been removed successfully"),
      color: "green",
    });
  };

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  return (
    <Box mb="lg">
      {/* Cover image (if exists) */}
      {coverImageUrl && (
        <Box pos="relative" mb="md">
          <Image
            src={coverImageUrl}
            alt={project.name}
            height={200}
            radius="md"
            fit="cover"
          />
          <Group
            justify="flex-end"
            style={{ position: "absolute", top: 10, right: 10 }}
          >
            <ActionIcon
              variant="filled"
              color="dark"
              radius="xl"
              onClick={open}
              title={t("Change Cover")}
            >
              <IconEdit size={16} />
            </ActionIcon>
            <ActionIcon
              variant="filled"
              color="red"
              radius="xl"
              onClick={handleRemoveCoverImage}
              title={t("Remove Cover")}
            >
              <IconX size={16} />
            </ActionIcon>
          </Group>
        </Box>
      )}

      {/* Project title */}
      <Group justify="space-between" mb="md">
        {isEditingTitle ? (
          <TextInput
            ref={titleInputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleUpdate}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleTitleUpdate();
              }
            }}
            placeholder={t("Project Title")}
            style={{ flex: 1 }}
            autoFocus
          />
        ) : (
          <Group>
            <Title order={1}>{project.name}</Title>
            <ActionIcon
              variant="subtle"
              onClick={() => {
                setIsEditingTitle(true);
                setTimeout(() => focusInput(titleInputRef), 100);
              }}
            >
              <IconEdit size={18} />
            </ActionIcon>
          </Group>
        )}

        {!coverImageUrl && (
          <Button
            variant="light"
            leftSection={<IconPhoto size={16} />}
            size="sm"
            onClick={open}
          >
            {t("Add Cover")}
          </Button>
        )}
      </Group>

      {/* Project description */}
      <Box mb="md">
        {isEditingDescription ? (
          <Textarea
            ref={descriptionInputRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionUpdate}
            placeholder={t("Add project description...")}
            autosize
            minRows={2}
            maxRows={6}
            style={{ width: "100%" }}
            autoFocus
          />
        ) : (
          <Group align="flex-start" wrap="nowrap">
            <Text
              color={description ? "inherit" : "dimmed"}
              onClick={() => {
                setIsEditingDescription(true);
                setTimeout(() => focusInput(descriptionInputRef), 100);
              }}
              style={{ flex: 1, cursor: "pointer" }}
            >
              {description || t("Add project description...")}
            </Text>
            <ActionIcon
              variant="subtle"
              onClick={() => {
                setIsEditingDescription(true);
                setTimeout(() => focusInput(descriptionInputRef), 100);
              }}
            >
              <IconEdit size={18} />
            </ActionIcon>
          </Group>
        )}
      </Box>

      {/* Project metadata */}
      <Grid mt="md" gutter="xl">
        {/* Due Dates */}
        <Grid.Col span={6}>
          <Group align="flex-start" gap="xs">
            <IconCalendar size={16} style={{ marginTop: 3 }} />
            <Box>
              <Text fw={500} size="sm">
                {t("Timeline")}
              </Text>
              <Popover position="bottom" withArrow shadow="md">
                <Popover.Target>
                  <Group gap="xs" style={{ cursor: "pointer" }}>
                    <Text size="sm" color={startDate ? "inherit" : "dimmed"}>
                      {startDate
                        ? startDate.toLocaleDateString()
                        : t("Set start date")}
                    </Text>
                    <Text size="sm"> - </Text>
                    <Text size="sm" color={endDate ? "inherit" : "dimmed"}>
                      {endDate
                        ? endDate.toLocaleDateString()
                        : t("Set due date")}
                    </Text>
                  </Group>
                </Popover.Target>
                <Popover.Dropdown>
                  <Stack>
                    <DateInput
                      value={startDate}
                      onChange={setStartDate}
                      label={t("Start date")}
                      placeholder={t("Pick start date")}
                      clearable
                    />
                    <DateInput
                      value={endDate}
                      onChange={setEndDate}
                      label={t("Due date")}
                      placeholder={t("Pick due date")}
                      clearable
                      minDate={startDate || undefined}
                    />
                    <Button
                      onClick={handleDatesUpdate}
                      fullWidth
                      disabled={
                        startDate ===
                          (project.startDate
                            ? new Date(project.startDate)
                            : null) &&
                        endDate ===
                          (project.endDate ? new Date(project.endDate) : null)
                      }
                    >
                      {t("Save")}
                    </Button>
                  </Stack>
                </Popover.Dropdown>
              </Popover>
            </Box>
          </Group>
        </Grid.Col>

        {/* Priority */}
        <Grid.Col span={6}>
          <Group align="flex-start" gap="xs">
            <IconFlag size={16} style={{ marginTop: 3 }} />
            <Box>
              <Text fw={500} size="sm">
                {t("Priority")}
              </Text>
              <Select
                size="xs"
                data={priorityOptions}
                value={priority}
                onChange={(value: TaskPriority) => setPriority(value)}
                styles={{
                  input: {
                    border: "none",
                    padding: 0,
                    backgroundColor: "transparent",
                  },
                }}
              />
            </Box>
          </Group>
        </Grid.Col>

        {/* Members */}
        <Grid.Col span={6}>
          <Group align="flex-start" gap="xs">
            <IconUsers size={16} style={{ marginTop: 3 }} />
            <Box>
              <Text fw={500} size="sm">
                {t("Members")}
              </Text>
              <Popover position="bottom" withArrow shadow="md">
                <Popover.Target>
                  <Group gap={-8} style={{ cursor: "pointer" }}>
                    {selectedMembers.length > 0 ? (
                      selectedMembers.slice(0, 3).map((memberId) => {
                        const user = typedUsers.find((u) => u.id === memberId);
                        return (
                          <Avatar
                            key={memberId}
                            src={user?.avatarUrl}
                            radius="xl"
                            size="sm"
                          />
                        );
                      })
                    ) : (
                      <Text size="sm" color="dimmed">
                        {t("Add members")}
                      </Text>
                    )}
                    {selectedMembers.length > 3 && (
                      <Avatar radius="xl" size="sm">
                        +{selectedMembers.length - 3}
                      </Avatar>
                    )}
                  </Group>
                </Popover.Target>
                <Popover.Dropdown>
                  <MultiSelect
                    label={t("Project members")}
                    data={typedUsers.map((user) => ({
                      value: user.id,
                      label: user.name || user.email,
                    }))}
                    value={selectedMembers}
                    onChange={setSelectedMembers}
                    placeholder={t("Select members")}
                    searchable
                    clearable
                  />
                </Popover.Dropdown>
              </Popover>
            </Box>
          </Group>
        </Grid.Col>

        {/* Labels/Tags */}
        <Grid.Col span={6}>
          <Group align="flex-start" gap="xs">
            <IconTags size={16} style={{ marginTop: 3 }} />
            <Box>
              <Text fw={500} size="sm">
                {t("Tags")}
              </Text>
              <Popover position="bottom" withArrow shadow="md">
                <Popover.Target>
                  <Group gap={5} style={{ cursor: "pointer" }}>
                    {selectedLabels.length > 0 ? (
                      selectedLabels.slice(0, 3).map((labelId) => {
                        const label = labels.find((l) => l.id === labelId);
                        return label ? (
                          <Badge key={labelId} color={label.color} size="sm">
                            {label.name}
                          </Badge>
                        ) : null;
                      })
                    ) : (
                      <Text size="sm" color="dimmed">
                        {t("Add tags")}
                      </Text>
                    )}
                    {selectedLabels.length > 3 && (
                      <Badge size="sm">+{selectedLabels.length - 3}</Badge>
                    )}
                  </Group>
                </Popover.Target>
                <Popover.Dropdown>
                  <MultiSelect
                    label={t("Project tags")}
                    data={labels.map((label) => ({
                      value: label.id,
                      label: label.name,
                      group: "Existing Tags",
                    }))}
                    value={selectedLabels}
                    onChange={setSelectedLabels}
                    placeholder={t("Select tags")}
                    searchable
                    clearable
                  />
                </Popover.Dropdown>
              </Popover>
            </Box>
          </Group>
        </Grid.Col>
      </Grid>

      {/* Cover image modal */}
      <Modal
        opened={opened}
        onClose={handleModalClose}
        title={t("Cover Image")}
      >
        <Stack>
          <Text size="sm" fw={500}>
            {t("Upload from your device:")}
          </Text>
          <FileInput
            placeholder={t("Select image file")}
            accept="image/*"
            onChange={handleFileUpload}
            clearable
          />

          {coverImageFile && (
            <Text size="xs" c="dimmed">
              {coverImageFile.name} ({Math.round(coverImageFile.size / 1024)}{" "}
              KB)
            </Text>
          )}

          <Divider label={t("OR")} labelPosition="center" my="xs" />

          <Text size="sm" fw={500}>
            {t("Enter image URL:")}
          </Text>
          <TextInput
            placeholder="https://example.com/image.jpg"
            value={coverImageUrl || ""}
            onChange={(e) => setCoverImageUrl(e.target.value)}
          />

          {/* Preview section */}
          {(coverImageUrl || coverImageFile) && (
            <Box>
              <Text size="sm" fw={500}>
                {t("Preview:")}
              </Text>
              <Image
                src={coverImageUrl}
                height={150}
                fit="contain"
                my="xs"
                radius="sm"
                onError={() => {
                  // Don't show error here, we'll handle it when they click Add cover
                }}
              />
            </Box>
          )}

          <Group justify="space-between">
            <Button variant="outline" onClick={handleModalClose}>
              {t("Cancel")}
            </Button>
            <Button
              onClick={() => {
                if (coverImageFile) {
                  uploadFileToServer(coverImageFile);
                } else if (coverImageUrl) {
                  processImageUrl(coverImageUrl);
                } else {
                  handleModalClose();
                }
              }}
              disabled={!coverImageFile && !coverImageUrl}
            >
              {t("Add cover")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
