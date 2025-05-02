import {
  Text,
  Avatar,
  SimpleGrid,
  Card,
  rem,
  Button,
  Group,
  Loader,
} from "@mantine/core";
import React, { useEffect, useCallback, useState } from "react";
import {
  prefetchSpace,
  useGetSpacesQuery,
} from "@/features/space/queries/space-query.ts";
import { getSpaceUrl } from "@/lib/config.ts";
import { Link } from "react-router-dom";
import classes from "./space-grid.module.css";
import { formatMemberCount } from "@/lib";
import { useTranslation } from "react-i18next";
import { IconRefresh } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { mcpSocketAtom } from "@/features/websocket/atoms/mcp-socket-atom";
import {
  MCPEventType,
  MCPResourceType,
} from "@/features/websocket/types/mcp-event.types";

export default function SpaceGrid() {
  const { t } = useTranslation();
  const [socket] = useAtom(mcpSocketAtom);
  const { data, isLoading, refetch, isRefetching } = useGetSpacesQuery({
    page: 1,
  });
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Handle immediate refetch when a space is created
  const handleSpaceEvent = useCallback(
    (event) => {
      if (
        event.resource === MCPResourceType.SPACE &&
        (event.type === MCPEventType.CREATED ||
          event.type === MCPEventType.UPDATED ||
          event.type === MCPEventType.DELETED)
      ) {
        console.log(
          "🔄 SpaceGrid: Space event detected, refreshing spaces...",
          event
        );
        setRefreshing(true);
        refetch().finally(() => setRefreshing(false));
      }
    },
    [refetch]
  );

  // Register for direct MCP events
  useEffect(() => {
    if (socket) {
      // Listen directly for MCP events
      socket.on("mcp:event", handleSpaceEvent);

      return () => {
        socket.off("mcp:event", handleSpaceEvent);
      };
    } else {
      // Socket not available, force a one-time refresh
      console.log(
        "🔍 SpaceGrid: Socket not available, forcing one-time refresh"
      );
      refetch();
    }
  }, [socket, handleSpaceEvent, refetch]);

  // Force a refetch when the component mounts and set up periodic refreshes
  useEffect(() => {
    console.log("🔍 SpaceGrid: Component mounted, fetching spaces...");
    // Refetch immediately on mount
    refetch();

    // Setup an interval for periodic checks - use a shorter interval if no socket
    const refreshInterval = setInterval(
      () => {
        console.log("⏱️ SpaceGrid: Periodic refresh triggered");
        refetch();
      },
      socket ? 30000 : 10000
    ); // Check every 30 seconds with socket, every 10 seconds without

    return () => {
      clearInterval(refreshInterval);
    };
  }, [refetch, socket]);

  // Force a manual refetch when refresh button is clicked
  const handleManualRefresh = () => {
    console.log("👆 SpaceGrid: Manual refresh triggered");
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  const cards = data?.items.map((space, index) => (
    <Card
      key={space.id}
      p="xs"
      radius="md"
      component={Link}
      to={getSpaceUrl(space.slug)}
      onMouseEnter={() => prefetchSpace(space.slug, space.id)}
      className={classes.card}
      withBorder
    >
      <Card.Section className={classes.cardSection} h={40}></Card.Section>
      <Avatar
        name={space.name}
        color="initials"
        variant="filled"
        size="md"
        mt={rem(-20)}
      />

      <Text fz="md" fw={500} mt="xs" className={classes.title}>
        {space.name}
      </Text>

      <Text c="dimmed" size="xs" fw={700} mt="md">
        {formatMemberCount(space.memberCount, t)}
      </Text>
    </Card>
  ));

  return (
    <>
      <Group justify="space-between" mb="md">
        <Text fz="sm" fw={500}>
          {t("Spaces you belong to")}
        </Text>
        <Button
          variant="subtle"
          size="xs"
          leftSection={
            refreshing ? <Loader size="xs" /> : <IconRefresh size={16} />
          }
          onClick={handleManualRefresh}
          loading={refreshing}
          disabled={refreshing || isRefetching}
        >
          {refreshing ? t("Refreshing...") : t("Refresh")}
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }}>
        {isLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              padding: "20px",
            }}
          >
            <Loader size="sm" />
          </div>
        ) : (
          cards
        )}
      </SimpleGrid>
    </>
  );
}
