import {
  Box,
  Button,
  Flex,
  Group,
  SegmentedControl,
  Text,
  Title,
  ActionIcon,
  Tooltip,
  Menu,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconCalendar,
  IconLayoutColumns,
  IconLayoutRows,
  IconList,
  IconTable,
  IconFilter,
  IconPlus,
  IconGridDots,
  IconLayoutKanban,
  IconLayoutSidebarRightExpand,
  IconCalendarTime,
  IconColumns,
  IconArrowsSort,
} from "@tabler/icons-react";
import { useBoardContext } from "../board-context";
import { useTranslation } from "react-i18next";

interface BoardHeaderProps {
  onToggleFilters: () => void;
}

export function BoardHeader({ onToggleFilters }: BoardHeaderProps) {
  const { t } = useTranslation();
  const {
    project,
    viewMode,
    setViewMode,
    groupBy,
    setGroupBy,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  } = useBoardContext();

  // Handle sort selection
  const handleSortChange = (value: string) => {
    console.log(
      `SORT: Changing sort. Current: ${sortBy} (${sortOrder}), New value: ${value}`
    );
    if (value === "position") {
      setSortBy("position");
      setSortOrder("asc");
    } else if (value === sortBy) {
      const newOrder = sortOrder === "asc" ? "desc" : "asc";
      console.log(`SORT: Toggling order to ${newOrder}`);
      setSortOrder(newOrder);
    } else {
      console.log(`SORT: Setting new field to ${value}, order asc`);
      setSortBy(value as any);
      setSortOrder("asc");
    }
  };

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
            {
              value: "columns",
              label: (
                <Group gap={5}>
                  <IconTable size={16} />
                  <Text size="sm">{t("Columns")}</Text>
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

        <Group>
          {/* Sort Button Menu */}
          <Menu position="bottom-end" withArrow shadow="md">
            <Menu.Target>
              <Tooltip label={t("Sort Tasks")}>
                <Button
                  variant="light"
                  size="sm"
                  leftSection={<IconArrowsSort size={16} />}
                >
                  {t("Sort")}
                </Button>
              </Tooltip>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{t("Sort by")}</Menu.Label>
              <Menu.Item
                leftSection={<IconGridDots size={16} />}
                rightSection={sortBy === "position" ? "✓" : null}
                onClick={() => handleSortChange("position")}
              >
                {t("Custom Order")} {sortBy === "position" && t("(Current)")}
              </Menu.Item>
              <Menu.Item
                rightSection={
                  sortBy === "title" ? (sortOrder === "asc" ? "↑" : "↓") : null
                }
                onClick={() => handleSortChange("title")}
              >
                {t("Title")}{" "}
                {sortBy === "title" &&
                  (sortOrder === "asc" ? t("(A-Z)") : t("(Z-A)"))}
              </Menu.Item>
              <Menu.Item
                rightSection={
                  sortBy === "priority"
                    ? sortOrder === "asc"
                      ? "↑"
                      : "↓"
                    : null
                }
                onClick={() => handleSortChange("priority")}
              >
                {t("Priority")}{" "}
                {sortBy === "priority" &&
                  (sortOrder === "asc" ? t("(Low-High)") : t("(High-Low)"))}
              </Menu.Item>
              <Menu.Item
                rightSection={
                  sortBy === "dueDate"
                    ? sortOrder === "asc"
                      ? "↑"
                      : "↓"
                    : null
                }
                onClick={() => handleSortChange("dueDate")}
              >
                {t("Due Date")}{" "}
                {sortBy === "dueDate" &&
                  (sortOrder === "asc" ? t("(Early-Late)") : t("(Late-Early)"))}
              </Menu.Item>
              <Menu.Item
                rightSection={
                  sortBy === "createdAt"
                    ? sortOrder === "asc"
                      ? "↑"
                      : "↓"
                    : null
                }
                onClick={() => handleSortChange("createdAt")}
              >
                {t("Created Date")}{" "}
                {sortBy === "createdAt" &&
                  (sortOrder === "asc" ? t("(Old-New)") : t("(New-Old)"))}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          {/* Filter Button */}
          <Tooltip label={t("Filter Tasks")}>
            <Button
              variant="light"
              size="sm"
              leftSection={<IconFilter size={16} />}
              onClick={onToggleFilters}
            >
              {t("Filters")}
            </Button>
          </Tooltip>
        </Group>
      </Group>
    </Box>
  );
}
