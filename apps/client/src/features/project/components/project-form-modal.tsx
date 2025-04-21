import { useEffect } from "react";
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

export default function ProjectFormModal({
  opened,
  onClose,
  spaceId,
  workspaceId,
  project,
}: ProjectFormModalProps) {
  const { t } = useTranslation();
  const isEditing = !!project;

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

  useEffect(() => {
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
  }, [project, form]);

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

  const loading = isEditing
    ? updateProjectMutation.isPending
    : createProjectMutation.isPending;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditing ? t("Edit Project") : t("Create New Project")}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Flex gap="sm" align="flex-end">
            <Box style={{ flex: "0 0 auto" }}>
              <EmojiPicker
                onEmojiSelect={handleSetEmoji}
                icon={form.values.icon || "🎯"}
                removeEmojiAction={() => form.setFieldValue("icon", "")}
                readOnly={false}
              />
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
            <Button variant="default" onClick={onClose}>
              {t("Cancel")}
            </Button>
            <Button type="submit" loading={loading}>
              {isEditing ? t("Update Project") : t("Create Project")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
