import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ActionIcon,
  Box,
  Group,
  Menu,
  Text,
  Tooltip,
  Stack,
  Button,
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronRight,
  IconDotsVertical,
  IconEdit,
  IconPlus,
  IconTrash,
  IconFile,
  IconFolder,
  IconFolderFilled,
  IconNote,
  IconNotes,
  IconFileText,
} from "@tabler/icons-react";
import clsx from "clsx";
import { useDisclosure, useElementSize, useMergedRef } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { notifications } from "@mantine/notifications";
import classes from "../styles/project-file-tree.module.css";

// Types for the tree nodes
interface ProjectFileNode {
  id: string;
  name: string;
  children?: ProjectFileNode[];
  type: "folder" | "file" | "document";
  parentId?: string | null;
  isParent?: boolean;
  spaceId?: string;
  projectId?: string;
  url?: string;
}

interface ProjectFileTreeProps {
  projectId: string;
  readOnly?: boolean;
  onFileSelect?: (fileId: string) => void;
  spaceId: string;
}

export function ProjectFileTree({
  projectId,
  readOnly = false,
  onFileSelect,
  spaceId,
}: ProjectFileTreeProps) {
  const { t } = useTranslation();
  const [treeData, setTreeData] = useState<ProjectFileNode[]>([]);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const rootElement = useRef<HTMLDivElement>(null);
  const { ref: sizeRef, width, height } = useElementSize();
  const mergedRef = useMergedRef(rootElement, sizeRef);
  const navigate = useNavigate();

  // TODO: Replace with actual API call to get project files
  useEffect(() => {
    // Mock data for initial development
    const mockData: ProjectFileNode[] = [
      {
        id: "folder-1",
        name: "Project Documentation",
        type: "folder",
        isParent: true,
        projectId,
        spaceId,
        children: [
          {
            id: "file-1",
            name: "Requirements.md",
            type: "file",
            parentId: "folder-1",
            projectId,
            spaceId,
          },
          {
            id: "file-2",
            name: "Architecture.md",
            type: "file",
            parentId: "folder-1",
            projectId,
            spaceId,
          },
        ],
      },
      {
        id: "folder-2",
        name: "Design Assets",
        type: "folder",
        isParent: true,
        projectId,
        spaceId,
        children: [
          {
            id: "file-3",
            name: "Mockups.png",
            type: "file",
            parentId: "folder-2",
            projectId,
            spaceId,
          },
        ],
      },
      {
        id: "file-4",
        name: "README.md",
        type: "file",
        projectId,
        spaceId,
      },
    ];

    setTreeData(mockData);
  }, [projectId, spaceId]);

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleFileSelect = (fileId: string) => {
    setSelectedFile(fileId);
    if (onFileSelect) {
      onFileSelect(fileId);
    }
  };

  const renderTreeNode = (node: ProjectFileNode, level = 0) => {
    const isFolder = node.type === "folder";
    const isOpen = openFolders[node.id] || false;
    const isSelected = selectedFile === node.id;

    const getFileIcon = () => {
      if (isFolder) {
        return isOpen ? (
          <IconFolderFilled size={16} color="#228be6" />
        ) : (
          <IconFolder size={16} color="#228be6" />
        );
      }

      // Check file extension to determine icon
      const fileName = node.name.toLowerCase();
      if (fileName.endsWith(".md") || fileName.endsWith(".markdown")) {
        return <IconFileText size={16} color="#74c0fc" />;
      } else if (fileName.endsWith(".txt")) {
        return <IconNote size={16} color="#74c0fc" />;
      } else if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) {
        return <IconNotes size={16} color="#74c0fc" />;
      }

      return <IconFile size={16} color="#74c0fc" />;
    };

    return (
      <React.Fragment key={node.id}>
        <div
          className={clsx(classes.node, isSelected && classes.nodeSelected)}
          style={{ paddingLeft: `${level * 16}px` }}
          onClick={() => {
            if (isFolder) {
              toggleFolder(node.id);
            } else {
              handleFileSelect(node.id);
            }
          }}
        >
          <Group gap={4} wrap="nowrap">
            {isFolder ? (
              <ActionIcon
                size={16}
                variant="transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(node.id);
                }}
                className={classes.arrowButton}
              >
                {isOpen ? (
                  <IconChevronDown size={16} stroke={1.5} />
                ) : (
                  <IconChevronRight size={16} stroke={1.5} />
                )}
              </ActionIcon>
            ) : (
              <div style={{ width: 16, marginRight: 4 }} />
            )}

            {getFileIcon()}

            <Text
              size="xs"
              className={classes.nodeLabel}
              fw={isSelected ? 600 : 400}
            >
              {node.name}
            </Text>

            {!readOnly && (
              <Menu shadow="md" position="bottom-end">
                <Menu.Target>
                  <ActionIcon
                    size="xs"
                    variant="transparent"
                    className={classes.menuButton}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconDotsVertical size={14} stroke={1.5} />
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                  {isFolder && (
                    <Menu.Item
                      leftSection={<IconPlus size={14} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        notifications.show({
                          title: t("Not implemented"),
                          message: t("Adding files is not yet implemented"),
                          color: "yellow",
                        });
                      }}
                    >
                      {t("Add file")}
                    </Menu.Item>
                  )}
                  <Menu.Item
                    leftSection={<IconEdit size={14} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      notifications.show({
                        title: t("Not implemented"),
                        message: t("Renaming files is not yet implemented"),
                        color: "yellow",
                      });
                    }}
                  >
                    {t("Rename")}
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconTrash size={14} />}
                    color="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      notifications.show({
                        title: t("Not implemented"),
                        message: t("File deletion is not yet implemented"),
                        color: "yellow",
                      });
                    }}
                  >
                    {t("Delete")}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </div>

        {/* Render children if folder is open */}
        {isFolder &&
          isOpen &&
          node.children &&
          node.children.map((child) => renderTreeNode(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <Box ref={mergedRef} h={height} className={classes.treeContainer}>
      {treeData.length > 0 ? (
        <div>{treeData.map((node) => renderTreeNode(node))}</div>
      ) : (
        <Stack align="center" justify="center" h="100%" p="md" gap="xs">
          <Text size="sm" c="dimmed">
            {t("No files found in this project")}
          </Text>
          {!readOnly && (
            <Button
              size="xs"
              variant="light"
              leftSection={<IconPlus size={14} />}
            >
              {t("Add file")}
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
}
