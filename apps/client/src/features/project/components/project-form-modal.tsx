import { useEffect, useState, memo, Suspense, useRef } from "react";
import {
  Modal,
  Button,
  TextInput,
  Textarea,
  Group,
  Stack,
  ColorInput,
  Flex,
  Box,
  Loader,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from "../hooks/use-projects";
import { Project } from "../types";
import { useTranslation } from "react-i18next";
import EmojiPicker from "@/components/ui/emoji-picker";

interface ProjectFormModalProps {
  opened: boolean;
  onClose: () => void;
  spaceId: string;
  workspaceId: string;
  project?: Project;
}

// Use memo to prevent unnecessary re-renders when parent components re-render
const ProjectFormModal = memo(function ProjectFormModal({
  opened,
  onClose,
  spaceId,
  workspaceId,
  project,
}: ProjectFormModalProps) {
  const { t } = useTranslation();
  const isEditing = !!project;

  // Use ref instead of state to avoid re-renders when tracking initialization
  const hasInitializedForm = useRef(false);

  const form = useForm({
    initialValues: {
      name: "",
      description: "",
      icon: "",
      color: "",
      startDate: null as Date | null,
      endDate: null as Date | null,
    },
    validate: {
      name: (value) =>
        value.trim().length === 0 ? t("Name is required") : null,
    },
  });

  const createProjectMutation = useCreateProjectMutation();
  const updateProjectMutation = useUpdateProjectMutation();
  const isLoading = isEditing
    ? updateProjectMutation.isPending
    : createProjectMutation.isPending;

  // Reset initialization ref when modal closes
  useEffect(() => {
    if (!opened) {
      hasInitializedForm.current = false;
    }
  }, [opened]);

  // Only update form values when modal opens or project changes, not on every render
  useEffect(() => {
    // Skip if already initialized or modal is closed
    if (!opened || hasInitializedForm.current) {
      return;
    }

    if (project) {
      form.setValues({
        name: project.name,
        description: project.description || "",
        icon: project.icon || "",
        color: project.color || "",
        startDate: project.startDate ? new Date(project.startDate) : null,
        endDate: project.endDate ? new Date(project.endDate) : null,
      });
    } else {
      form.reset();
    }

    // Mark as initialized
    hasInitializedForm.current = true;
  }, [project, form, opened]);

  // Clean up form state when component unmounts
  useEffect(() => {
    return () => {
      if (!opened) {
        form.reset();
      }
    };
  }, [opened, form]);

  const handleSubmit = form.onSubmit((values) => {
    if (isEditing && project) {
      updateProjectMutation.mutate(
        {
          projectId: project.id,
          ...values,
        },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    } else {
      createProjectMutation.mutate(
        {
          ...values,
          spaceId,
        },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    }
  });

  const handleSetEmoji = (emoji: any) => {
    form.setFieldValue("icon", emoji.native || emoji);
  };

  // Use an inner component for the form to prevent re-renders of the form when modal state changes
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditing ? t("Edit Project") : t("Create New Project")}
      size="md"
      zIndex={1000}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Flex gap="sm" align="flex-end">
            <Box style={{ flex: "0 0 auto" }}>
              <Suspense fallback={<Loader size="sm" />}>
                <EmojiPicker
                  onEmojiSelect={handleSetEmoji}
                  icon={form.values.icon || "🎯"}
                  removeEmojiAction={() => form.setFieldValue("icon", "")}
                  readOnly={false}
                />
              </Suspense>
            </Box>
            <TextInput
              required
              label={t("Project Name")}
              placeholder={t("Enter project name")}
              {...form.getInputProps("name")}
              style={{ flex: 1 }}
            />
          </Flex>

          <Textarea
            label={t("Description")}
            placeholder={t("Enter project description (optional)")}
            minRows={3}
            {...form.getInputProps("description")}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <ColorInput
              label={t("Color")}
              placeholder={t("Choose project color (optional)")}
              format="hex"
              swatches={[
                "#25262b",
                "#868e96",
                "#fa5252",
                "#e64980",
                "#be4bdb",
                "#7950f2",
                "#4c6ef5",
                "#228be6",
                "#15aabf",
                "#12b886",
                "#40c057",
                "#82c91e",
                "#fab005",
                "#fd7e14",
              ]}
              {...form.getInputProps("color")}
            />
          </div>

          <Group grow>
            <TextInput
              label={t("Start Date")}
              placeholder={t("YYYY-MM-DD")}
              {...form.getInputProps("startDate")}
            />
            <TextInput
              label={t("End Date")}
              placeholder={t("YYYY-MM-DD")}
              {...form.getInputProps("endDate")}
            />
          </Group>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={isLoading}>
              {t("Cancel")}
            </Button>
            <Button type="submit" loading={isLoading}>
              {isLoading
                ? t("Creating Project...")
                : isEditing
                  ? t("Update Project")
                  : t("Create Project")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
});

export default ProjectFormModal;
