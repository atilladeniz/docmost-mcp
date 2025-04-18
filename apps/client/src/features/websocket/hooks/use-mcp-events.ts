import { useAtom } from "jotai";
import { mcpSocketAtom } from "../atoms/mcp-socket-atom";
import { useEffect, useRef } from "react";
import {
  MCPEvent,
  MCPEventType,
  MCPResourceType,
} from "../types/mcp-event.types";
import { useQueryClient } from "@tanstack/react-query";
import { treeDataAtom } from "@/features/page/tree/atoms/tree-data-atom";
import { SimpleTree } from "react-arborist";
import { SpaceTreeNode } from "@/features/page/tree/types";

/**
 * A hook that listens for MCP events and updates the application state accordingly
 */
export const useMCPEvents = () => {
  const [socket] = useAtom(mcpSocketAtom);
  const [treeData, setTreeData] = useAtom(treeDataAtom);
  const queryClient = useQueryClient();
  const eventHandlerRegistered = useRef(false);

  useEffect(() => {
    if (!socket) {
      console.log(
        "%c[MCP-EVENTS] Socket not available, cannot listen for events",
        "background: #F44336; color: white; padding: 3px; border-radius: 3px;"
      );
      return;
    }

    // Avoid double registration
    if (eventHandlerRegistered.current) {
      console.log(
        "%c[MCP-EVENTS] Event handlers already registered, skipping",
        "background: #FF9800; color: white; padding: 3px; border-radius: 3px;"
      );
      return;
    }

    console.log(
      "%c[MCP-EVENTS] Setting up event listeners",
      "background: #2196F3; color: white; padding: 3px; border-radius: 3px;"
    );

    // Define the event handler
    const handleMCPEvent = (event: MCPEvent) => {
      console.log(
        `%c[MCP-EVENT RECEIVED] ${event.type}.${event.resource} %cID: ${event.resourceId}`,
        "background: #4CAF50; color: white; padding: 3px; border-radius: 3px;",
        "color: #2196F3; font-weight: bold;"
      );
      console.log("Event details:", event);

      // Handle different resource types
      switch (event.resource) {
        case MCPResourceType.PAGE:
          console.log(
            `%c[MCP-EVENT] Processing PAGE event`,
            "color: #FF9800; font-weight: bold;"
          );
          handlePageEvent(event);
          break;
        case MCPResourceType.SPACE:
          console.log(
            `%c[MCP-EVENT] Processing SPACE event`,
            "color: #FF9800; font-weight: bold;"
          );
          handleSpaceEvent(event);
          break;
        case MCPResourceType.COMMENT:
          console.log(
            `%c[MCP-EVENT] Processing COMMENT event`,
            "color: #FF9800; font-weight: bold;"
          );
          handleCommentEvent(event);
          break;
        case MCPResourceType.ATTACHMENT:
          console.log(
            `%c[MCP-EVENT] Processing ATTACHMENT event`,
            "color: #FF9800; font-weight: bold;"
          );
          handleAttachmentEvent(event);
          break;
        case MCPResourceType.GROUP:
          console.log(
            `%c[MCP-EVENT] Processing GROUP event`,
            "color: #FF9800; font-weight: bold;"
          );
          handleGroupEvent(event);
          break;
        case MCPResourceType.USER:
          console.log(
            `%c[MCP-EVENT] Processing USER event`,
            "color: #FF9800; font-weight: bold;"
          );
          handleUserEvent(event);
          break;
        case MCPResourceType.WORKSPACE:
          console.log(
            `%c[MCP-EVENT] Processing WORKSPACE event`,
            "color: #FF9800; font-weight: bold;"
          );
          handleWorkspaceEvent(event);
          break;
      }
    };

    // IMPORTANT: Make sure event listeners are not duplicated
    socket.off("mcp:event");

    // Register the event handler
    socket.on("mcp:event", handleMCPEvent);
    eventHandlerRegistered.current = true;

    console.log(
      "%c[MCP-EVENTS] Event listener registered successfully",
      "background: #4CAF50; color: white; padding: 3px; border-radius: 3px;"
    );

    // Cleanup function to remove event listener when component unmounts
    return () => {
      console.log(
        "%c[MCP-EVENTS] Removing event listeners",
        "background: #607D8B; color: white; padding: 3px; border-radius: 3px;"
      );
      socket.off("mcp:event", handleMCPEvent);
      eventHandlerRegistered.current = false;
    };
  }, [socket, queryClient]);

  // Function to handle page events
  const handlePageEvent = (event: MCPEvent) => {
    console.log(`%c[MCP-HANDLER] Handling PAGE event`, "color: #4CAF50;");
    if (
      event.type === MCPEventType.CREATED ||
      event.type === MCPEventType.UPDATED ||
      event.type === MCPEventType.DELETED
    ) {
      // Invalidate page queries
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      if (event.resourceId) {
        queryClient.invalidateQueries({
          queryKey: ["pages", event.resourceId],
        });
      }
    }
  };

  // Function to handle space events
  const handleSpaceEvent = (event: MCPEvent) => {
    console.log(`%c[MCP-HANDLER] Handling SPACE event`, "color: #4CAF50;");
    if (
      event.type === MCPEventType.CREATED ||
      event.type === MCPEventType.UPDATED ||
      event.type === MCPEventType.DELETED
    ) {
      // Invalidate space queries
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      if (event.resourceId) {
        queryClient.invalidateQueries({
          queryKey: ["spaces", event.resourceId],
        });
      }
    }
  };

  // Function to handle comment events
  const handleCommentEvent = (event: MCPEvent) => {
    console.log(`%c[MCP-HANDLER] Handling COMMENT event`, "color: #4CAF50;");
    if (event.data?.pageId) {
      queryClient.invalidateQueries({
        queryKey: ["comments", event.data.pageId],
      });
    }
  };

  // Function to handle attachment events
  const handleAttachmentEvent = (event: MCPEvent) => {
    console.log(`%c[MCP-HANDLER] Handling ATTACHMENT event`, "color: #4CAF50;");
    queryClient.invalidateQueries({ queryKey: ["attachments"] });
  };

  // Function to handle group events
  const handleGroupEvent = (event: MCPEvent) => {
    console.log(`%c[MCP-HANDLER] Handling GROUP event`, "color: #4CAF50;");
    queryClient.invalidateQueries({ queryKey: ["groups"] });
    if (event.resourceId) {
      queryClient.invalidateQueries({ queryKey: ["groups", event.resourceId] });
    }
  };

  // Function to handle user events
  const handleUserEvent = (event: MCPEvent) => {
    console.log(`%c[MCP-HANDLER] Handling USER event`, "color: #4CAF50;");
    queryClient.invalidateQueries({ queryKey: ["users"] });
    if (event.resourceId) {
      queryClient.invalidateQueries({ queryKey: ["users", event.resourceId] });
    }
  };

  // Function to handle workspace events
  const handleWorkspaceEvent = (event: MCPEvent) => {
    console.log(`%c[MCP-HANDLER] Handling WORKSPACE event`, "color: #4CAF50;");
    queryClient.invalidateQueries({ queryKey: ["workspace"] });
  };
};
