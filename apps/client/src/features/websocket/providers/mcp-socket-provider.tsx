import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { io } from "socket.io-client";
import { mcpSocketAtom } from "../atoms/mcp-socket-atom";
import { useMCPEvents } from "../hooks/use-mcp-events";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom";
import { getBackendUrl } from "@/lib/config";
import { MCPResourceType } from "../types/mcp-event.types";

// Use the base backend URL for socket connection
const MCP_BASE_URL = getBackendUrl().replace("/api", "");

interface MCPSocketProviderProps {
  children: React.ReactNode;
}

export const MCPSocketProvider: React.FC<MCPSocketProviderProps> = ({
  children,
}) => {
  const [, setMcpSocket] = useAtom(mcpSocketAtom);
  const [currentUser] = useAtom(currentUserAtom);
  const [subscribed, setSubscribed] = useState<boolean>(false);

  // Setup MCP socket connection
  useEffect(() => {
    // Only connect if we have a user and workspace
    if (!currentUser?.user || !currentUser?.workspace) {
      console.log(
        "%c[MCP-SOCKET] Connection delayed - waiting for user and workspace data",
        "background: #FFC107; color: black; padding: 3px; border-radius: 3px;"
      );
      return;
    }

    console.log(
      "%c[MCP-SOCKET] Initiating connection to MCP WebSocket...",
      "background: #2196F3; color: white; padding: 3px; border-radius: 3px;"
    );
    console.log(`%c[MCP-SOCKET] URL: ${MCP_BASE_URL}/mcp`, "color: #2196F3;");

    try {
      // Debug the URL and socket connection
      const socketUrl = `${MCP_BASE_URL}/mcp`;
      console.log(
        `%c[MCP-SOCKET] Connecting to: ${socketUrl}`,
        "color: #FF9800; font-weight: bold;"
      );

      // Connect to the MCP namespace
      const newSocket = io(socketUrl, {
        transports: ["websocket"],
        withCredentials: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        timeout: 10000,
        autoConnect: true,
      });

      // IMPORTANT: Set up event listeners BEFORE connection happens
      // Listen specifically for the raw mcp:event to debug
      newSocket.on("mcp:event", (event) => {
        console.log(
          "%c[MCP-SOCKET] Raw event received:",
          "background: #E91E63; color: white; padding: 3px; border-radius: 3px;",
          event
        );
      });

      // Attempt to reconnect if disconnected
      newSocket.io.on("reconnect_attempt", (attempt) => {
        console.log(
          `%c[MCP-SOCKET] Reconnection attempt #${attempt}`,
          "background: #FF9800; color: white; padding: 3px; border-radius: 3px;"
        );
      });

      newSocket.io.on("reconnect", (attempt) => {
        console.log(
          `%c[MCP-SOCKET] Reconnected after ${attempt} attempts!`,
          "background: #4CAF50; color: white; padding: 3px; border-radius: 3px;"
        );

        // Re-subscribe after reconnection
        if (currentUser?.workspace?.id) {
          console.log(
            "%c[MCP-SOCKET] Re-subscribing after reconnection",
            "background: #2196F3; color: white; padding: 3px; border-radius: 3px;"
          );
          subscribeToResources(newSocket, currentUser);
        }
      });

      // @ts-ignore
      setMcpSocket(newSocket);

      newSocket.on("connect", () => {
        console.log(
          "%c[MCP-SOCKET] Connected successfully! ✅ Socket ID:",
          "background: #4CAF50; color: white; padding: 3px; border-radius: 3px;",
          newSocket.id
        );

        // Subscribe to resources
        subscribeToResources(newSocket, currentUser);
      });

      newSocket.on("connect_error", (error) => {
        console.error(
          "%c[MCP-SOCKET] Connection error! ❌",
          "background: #F44336; color: white; padding: 3px; border-radius: 3px;",
          error.message
        );
        console.error("Error details:", error);
      });

      newSocket.on("disconnect", (reason) => {
        console.log(
          "%c[MCP-SOCKET] Disconnected from server. Reason:",
          "background: #607D8B; color: white; padding: 3px; border-radius: 3px;",
          reason
        );
        setSubscribed(false);
      });

      newSocket.on("mcp:error", (error) => {
        console.error(
          "%c[MCP-SOCKET] Event error received",
          "background: #F44336; color: white; padding: 3px; border-radius: 3px;",
          error
        );
      });

      newSocket.on("mcp:connected", (data) => {
        console.log(
          "%c[MCP-SOCKET] Authentication successful",
          "background: #4CAF50; color: white; padding: 3px; border-radius: 3px;",
          data
        );
      });

      newSocket.on("mcp:subscribed", (data) => {
        console.log(
          "%c[MCP-SOCKET] Subscription successful",
          "background: #2196F3; color: white; padding: 3px; border-radius: 3px;",
          data
        );
      });

      // Force a reconnect if connection attempt takes too long
      const connectionTimeout = setTimeout(() => {
        if (!newSocket.connected) {
          console.log(
            "%c[MCP-SOCKET] Connection timed out, forcing reconnect...",
            "background: #FF9800; color: white; padding: 3px; border-radius: 3px;"
          );
          newSocket.disconnect();
          newSocket.connect();
        }
      }, 5000);

      return () => {
        clearTimeout(connectionTimeout);
        console.log(
          "%c[MCP-SOCKET] Cleaning up connection",
          "background: #607D8B; color: white; padding: 3px; border-radius: 3px;"
        );
        if (newSocket.connected) {
          newSocket.disconnect();
        }
      };
    } catch (error) {
      console.error(
        "%c[MCP-SOCKET] Error setting up socket connection:",
        "background: #F44336; color: white; padding: 3px; border-radius: 3px;",
        error
      );
    }
  }, [currentUser, setMcpSocket]);

  // Helper function to subscribe to necessary resources
  const subscribeToResources = (socket, currentUser) => {
    if (!socket || !currentUser?.workspace?.id) return;

    console.log(
      "%c[MCP-SOCKET] Subscribing to workspace events for workspace:",
      "background: #2196F3; color: white; padding: 3px; border-radius: 3px;",
      currentUser.workspace.id
    );

    // Subscribe to workspace events
    socket.emit("mcp:subscribe", {
      resourceType: MCPResourceType.WORKSPACE,
      resourceId: currentUser.workspace.id,
    });

    // Subscribe to ALL resources in the workspace for testing
    // In production, you would be more selective
    const resources = Object.values(MCPResourceType);
    resources.forEach((resourceType) => {
      if (resourceType !== MCPResourceType.WORKSPACE) {
        console.log(
          `%c[MCP-SOCKET] Subscribing to all ${resourceType} events`,
          "background: #2196F3; color: white; padding: 3px; border-radius: 3px;"
        );

        socket.emit("mcp:subscribe", {
          resourceType: resourceType,
          resourceId: "all",
        });
      }
    });

    // Subscribe to spaces
    const defaultSpaceId = currentUser.workspace.defaultSpaceId;
    if (defaultSpaceId) {
      console.log(
        "%c[MCP-SOCKET] Subscribing to default space events:",
        "background: #2196F3; color: white; padding: 3px; border-radius: 3px;",
        defaultSpaceId
      );

      socket.emit("mcp:subscribe", {
        resourceType: MCPResourceType.SPACE,
        resourceId: defaultSpaceId,
      });
    }

    // Subscribe to user events
    console.log(
      "%c[MCP-SOCKET] Subscribing to user events:",
      "background: #2196F3; color: white; padding: 3px; border-radius: 3px;",
      currentUser.user.id
    );

    socket.emit("mcp:subscribe", {
      resourceType: MCPResourceType.USER,
      resourceId: currentUser.user.id,
    });

    setSubscribed(true);
  };

  // Use the MCP events hook to handle incoming events
  useMCPEvents();

  return <>{children}</>;
};
