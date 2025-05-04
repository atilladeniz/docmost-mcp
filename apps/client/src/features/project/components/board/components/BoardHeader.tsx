import {
  Box,
  Button,
  Flex,
  Group,
  SegmentedControl,
  Text,
  Title,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconCalendar,
  IconLayoutColumns,
  IconLayoutRows,
  IconList,
} from "@tabler/icons-react";
import { useBoardContext } from "../board-context";
import { useTranslation } from "react-i18next";

interface BoardHeaderProps {
  onToggleFilters: () => void;
}

export function BoardHeader({ onToggleFilters }: BoardHeaderProps) {
  const { t } = useTranslation();
  const { project, viewMode, setViewMode, groupBy, setGroupBy } =
    useBoardContext();

  return (
    <Box mb="md">
      <Group justify="space-between" align="center">
        <SegmentedControl
          value={viewMode}
          onChange={(value) => setViewMode(value as any)}
          data={[
            {
              value: "kanban",
              label: (
                <Group gap={5}>
                  <IconLayoutColumns size={16} />
                  <Text size="sm">{t("Kanban")}</Text>
                </Group>
              ),
            },
            {
              value: "swimlane",
              label: (
                <Group gap={5}>
                  <IconLayoutRows size={16} />
                  <Text size="sm">{t("Swimlane")}</Text>
                </Group>
              ),
            },
            {
              value: "list",
              label: (
                <Group gap={5}>
                  <IconList size={16} />
                  <Text size="sm">{t("List")}</Text>
                </Group>
              ),
            },
            {
              value: "timeline",
              label: (
                <Group gap={5}>
                  <IconCalendar size={16} />
                  <Text size="sm">{t("Timeline")}</Text>
                </Group>
              ),
            },
          ]}
        />

        {viewMode === "swimlane" && (
          <SegmentedControl
            value={groupBy}
            onChange={(value) => setGroupBy(value as any)}
            data={[
              { value: "status", label: t("Status") },
              { value: "assignee", label: t("Assignee") },
              { value: "priority", label: t("Priority") },
              { value: "date", label: t("Date") },
              { value: "labels", label: t("Labels") },
            ]}
          />
        )}

        <Button variant="light" onClick={onToggleFilters} size="sm">
          {t("Filters")}
        </Button>
      </Group>
    </Box>
  );
}
