import React, { useState } from "react";
import {
  Card,
  Title,
  TextInput,
  Group,
  Select,
  Button,
  Box,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import AttachmentList from "../components/attachment-list";
import { useLocation, useNavigate } from "react-router-dom";
import { IconSearch } from "@tabler/icons-react";

export default function AttachmentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Parse query parameters
  const searchParams = new URLSearchParams(location.search);
  const spaceId = searchParams.get("spaceId") || undefined;
  const pageId = searchParams.get("pageId") || undefined;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpaceId, setSelectedSpaceId] = useState(spaceId);

  // Handle search
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedSpaceId) params.append("spaceId", selectedSpaceId);
    navigate({ search: params.toString() });
  };

  // Handle clearing filters
  const handleClearFilters = () => {
    setSelectedSpaceId(undefined);
    navigate({ search: "" });
  };

  return (
    <Box p="md">
      <Title order={2} mb="md">
        {t("File Attachments")}
      </Title>

      <Card withBorder mb="md">
        <Group align="flex-end" mb="md">
          <TextInput
            label={t("Search files")}
            placeholder={t("Search by filename or type...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftSection={<IconSearch size={16} />}
            style={{ flexGrow: 1 }}
          />

          {/* 
          TODO: Add a space selector
          <Select
            label={t("Space")}
            placeholder={t("All spaces")}
            data={[]} // TODO: Fetch spaces
            value={selectedSpaceId}
            onChange={setSelectedSpaceId}
            clearable
          />
          */}

          <Button onClick={handleSearch}>{t("Search")}</Button>
          <Button variant="subtle" onClick={handleClearFilters}>
            {t("Clear Filters")}
          </Button>
        </Group>
      </Card>

      <Card withBorder>
        <AttachmentList spaceId={spaceId} pageId={pageId} />
      </Card>
    </Box>
  );
}
