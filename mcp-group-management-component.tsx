import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  Group,
  MultiSelect,
  Table,
  Text,
  TextInput,
  Title,
  Stack,
  Modal,
  Textarea,
  ActionIcon,
  Badge,
  Pagination,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconEdit,
  IconTrash,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

// Types
interface IGroup {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

interface IUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface IPaginationMeta {
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface IGroupListResponse {
  groups: IGroup[];
  pagination: IPaginationMeta;
}

interface IGroupMembersResponse {
  items: IUser[];
  meta: IPaginationMeta;
}

// MCP API functions
const WORKSPACE_ID = "your-workspace-id"; // Replace with your workspace ID

/**
 * Send a request to the MCP API
 */
async function sendMCPRequest(request: any) {
  const response = await fetch("/api/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Assuming auth token is handled by your fetch interceptor
    },
    body: JSON.stringify(request),
  });

  const result = await response.json();

  if (result.error) {
    throw new Error(`MCP error: ${result.error.message}`);
  }

  return result.result;
}

/**
 * List all groups in a workspace
 */
async function listGroups(
  workspaceId: string,
  page: number = 1,
  limit: number = 10,
  query: string = ""
): Promise<IGroupListResponse> {
  const request = {
    jsonrpc: "2.0",
    method: "group.list",
    params: { workspaceId, page, limit, query },
    id: `list-groups-${Date.now()}`,
  };

  return await sendMCPRequest(request);
}

/**
 * Create a new group
 */
async function createGroup(
  name: string,
  workspaceId: string,
  description: string = "",
  userIds: string[] = []
): Promise<IGroup> {
  const request = {
    jsonrpc: "2.0",
    method: "group.create",
    params: { name, description, userIds, workspaceId },
    id: `create-group-${Date.now()}`,
  };

  return await sendMCPRequest(request);
}

/**
 * Update a group
 */
async function updateGroup(
  groupId: string,
  workspaceId: string,
  name: string,
  description: string
): Promise<IGroup> {
  const request = {
    jsonrpc: "2.0",
    method: "group.update",
    params: { groupId, workspaceId, name, description },
    id: `update-group-${Date.now()}`,
  };

  return await sendMCPRequest(request);
}

/**
 * Delete a group
 */
async function deleteGroup(
  groupId: string,
  workspaceId: string
): Promise<{ success: boolean; message: string }> {
  const request = {
    jsonrpc: "2.0",
    method: "group.delete",
    params: { groupId, workspaceId },
    id: `delete-group-${Date.now()}`,
  };

  return await sendMCPRequest(request);
}

/**
 * Add multiple members to a group
 */
async function addGroupMembers(
  groupId: string,
  workspaceId: string,
  userIds: string[]
): Promise<{ success: boolean; message: string; userIds: string[] }> {
  const request = {
    jsonrpc: "2.0",
    method: "group.addMember",
    params: { groupId, workspaceId, userIds },
    id: `add-group-members-${Date.now()}`,
  };

  return await sendMCPRequest(request);
}

/**
 * Remove a member from a group
 */
async function removeGroupMember(
  groupId: string,
  workspaceId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  const request = {
    jsonrpc: "2.0",
    method: "group.removeMember",
    params: { groupId, workspaceId, userId },
    id: `remove-group-member-${Date.now()}`,
  };

  return await sendMCPRequest(request);
}

/**
 * List users in a workspace
 */
async function listWorkspaceUsers(
  workspaceId: string,
  page: number = 1,
  limit: number = 50,
  query: string = ""
): Promise<{ users: IUser[]; pagination: IPaginationMeta }> {
  const request = {
    jsonrpc: "2.0",
    method: "user.list",
    params: { workspaceId, page, limit, query },
    id: `list-users-${Date.now()}`,
  };

  return await sendMCPRequest(request);
}

// Main component
const GroupManagement: React.FC = () => {
  // State
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<IPaginationMeta>({
    page: 1,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [opened, { open, close }] = useDisclosure(false);
  const [editingGroup, setEditingGroup] = useState<IGroup | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  // Members modal
  const [membersOpened, { open: openMembers, close: closeMembers }] =
    useDisclosure(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [workspaceUsers, setWorkspaceUsers] = useState<IUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Load groups
  const loadGroups = async (page: number = 1, query: string = "") => {
    setLoading(true);
    try {
      const result = await listGroups(WORKSPACE_ID, page, 10, query);
      setGroups(result.groups);
      setPagination(result.pagination);
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error instanceof Error ? error.message : "Failed to load groups",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load workspace users
  const loadWorkspaceUsers = async () => {
    try {
      const result = await listWorkspaceUsers(WORKSPACE_ID);
      setWorkspaceUsers(result.users);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load workspace users",
        color: "red",
      });
    }
  };

  // Initial load
  useEffect(() => {
    loadGroups();
    loadWorkspaceUsers();
  }, []);

  // Handle page change
  useEffect(() => {
    loadGroups(currentPage, searchQuery);
  }, [currentPage]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    loadGroups(1, searchQuery);
  };

  // Handle create/edit group
  const handleSaveGroup = async () => {
    if (!groupName.trim()) {
      notifications.show({
        title: "Error",
        message: "Group name is required",
        color: "red",
      });
      return;
    }

    try {
      if (editingGroup) {
        // Update existing group
        await updateGroup(
          editingGroup.id,
          WORKSPACE_ID,
          groupName,
          groupDescription
        );
        notifications.show({
          title: "Success",
          message: "Group updated successfully",
          color: "green",
        });
      } else {
        // Create new group
        await createGroup(groupName, WORKSPACE_ID, groupDescription);
        notifications.show({
          title: "Success",
          message: "Group created successfully",
          color: "green",
        });
      }

      // Reset and reload
      setGroupName("");
      setGroupDescription("");
      setEditingGroup(null);
      close();
      loadGroups(currentPage);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Operation failed",
        color: "red",
      });
    }
  };

  // Handle delete group
  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group?")) {
      return;
    }

    try {
      await deleteGroup(groupId, WORKSPACE_ID);
      notifications.show({
        title: "Success",
        message: "Group deleted successfully",
        color: "green",
      });
      loadGroups(currentPage);
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error instanceof Error ? error.message : "Failed to delete group",
        color: "red",
      });
    }
  };

  // Handle adding members
  const handleAddMembers = async () => {
    if (!selectedGroupId || selectedUserIds.length === 0) {
      return;
    }

    try {
      const result = await addGroupMembers(
        selectedGroupId,
        WORKSPACE_ID,
        selectedUserIds
      );

      notifications.show({
        title: "Success",
        message: result.message,
        color: "green",
      });

      closeMembers();
      setSelectedUserIds([]);
      loadGroups(currentPage);
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error instanceof Error ? error.message : "Failed to add members",
        color: "red",
      });
    }
  };

  // Open add members modal
  const handleOpenAddMembers = (groupId: string) => {
    setSelectedGroupId(groupId);
    openMembers();
  };

  // Open edit modal
  const handleEditGroup = (group: IGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description);
    open();
  };

  // Handle new group
  const handleNewGroup = () => {
    setEditingGroup(null);
    setGroupName("");
    setGroupDescription("");
    open();
  };

  return (
    <Box p="md">
      <Title order={2} mb="lg">
        Group Management
      </Title>

      {/* Search and new group */}
      <Card withBorder mb="md">
        <Group justify="space-between">
          <Group>
            <TextInput
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch}>Search</Button>
          </Group>
          <Button
            onClick={handleNewGroup}
            leftSection={<IconUsers size={16} />}
          >
            New Group
          </Button>
        </Group>
      </Card>

      {/* Groups table */}
      <Card withBorder mb="md">
        <Table striped withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Members</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th style={{ width: 140 }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {groups.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text ta="center">
                    {loading ? "Loading..." : "No groups found"}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              groups.map((group) => (
                <Table.Tr key={group.id}>
                  <Table.Td>{group.name}</Table.Td>
                  <Table.Td>{group.description}</Table.Td>
                  <Table.Td>{group.memberCount}</Table.Td>
                  <Table.Td>
                    {group.isDefault ? (
                      <Badge color="blue">Default</Badge>
                    ) : (
                      <Badge color="gray">Custom</Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="blue"
                        onClick={() => handleOpenAddMembers(group.id)}
                        disabled={group.isDefault}
                      >
                        <IconUserPlus size={16} />
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => handleEditGroup(group)}
                        disabled={group.isDefault}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="red"
                        onClick={() => handleDeleteGroup(group.id)}
                        disabled={group.isDefault}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>

        {/* Pagination */}
        {groups.length > 0 && (
          <Box mt="md">
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={pagination.hasNextPage ? currentPage + 1 : currentPage}
              withEdges
            />
          </Box>
        )}
      </Card>

      {/* Create/Edit Group Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={editingGroup ? "Edit Group" : "Create New Group"}
      >
        <Stack>
          <TextInput
            label="Group Name"
            placeholder="Enter group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />

          <Textarea
            label="Description"
            placeholder="Enter group description"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            rows={3}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button onClick={handleSaveGroup}>
              {editingGroup ? "Update Group" : "Create Group"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Add Members Modal */}
      <Modal
        opened={membersOpened}
        onClose={closeMembers}
        title="Add Members to Group"
        size="lg"
      >
        <Stack>
          <MultiSelect
            label="Select Users"
            placeholder="Select users to add to the group"
            data={workspaceUsers.map((user) => ({
              value: user.id,
              label: user.name,
            }))}
            value={selectedUserIds}
            onChange={setSelectedUserIds}
            searchable
            nothingFoundMessage="No users found"
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={closeMembers}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMembers}
              disabled={selectedUserIds.length === 0}
            >
              Add Selected Users
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default GroupManagement;
