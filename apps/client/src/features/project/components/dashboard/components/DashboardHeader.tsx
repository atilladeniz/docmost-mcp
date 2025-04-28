import { Group, Title, Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface DashboardHeaderProps {
  onCreateProject: () => void;
}

export function DashboardHeader({ onCreateProject }: DashboardHeaderProps) {
  const { t } = useTranslation();

  return (
    <Group justify="space-between">
      <Title order={2}>{t("Project Dashboard")}</Title>
      <Button
        leftSection={<IconPlus size={16} />}
        onClick={onCreateProject}
        size="sm"
      >
        {t("Create Project")}
      </Button>
    </Group>
  );
}
