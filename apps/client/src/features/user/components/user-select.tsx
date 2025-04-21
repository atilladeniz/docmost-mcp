import { useState, useEffect } from "react";
import {
  Select,
  Avatar,
  Group,
  Text,
  SelectProps,
  Loader,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useSearchUsers } from "../hooks/use-search-users";

// Define the user data structure for the Select component
interface UserOption {
  value: string;
  label: string;
  image: string;
  email: string;
}

// Filter through workspace users
interface UserSelectProps extends Omit<SelectProps, "data" | "onChange"> {
  value: string | null;
  onChange: (value: string) => void;
}

export function UserSelect({ value, onChange, ...props }: UserSelectProps) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);

  const { data, isFetching } = useSearchUsers({
    query: debouncedSearch || undefined,
    limit: 20,
  });

  // Map API response to Select options
  useEffect(() => {
    if (data?.items) {
      const mappedUsers = data.items.map((user) => ({
        value: user.id,
        label: user.name || user.email.split("@")[0],
        image: user.avatarUrl || "",
        email: user.email,
      }));

      setUsers(mappedUsers);
    }
  }, [data]);

  return (
    <Select
      searchable
      data={users}
      value={value}
      onChange={(value) => onChange(value as string)}
      onSearchChange={setSearch}
      searchValue={search}
      nothingFoundMessage="No users found"
      maxDropdownHeight={280}
      clearable
      rightSection={isFetching ? <Loader size="xs" /> : null}
      renderOption={({ option }) => {
        const userOption = option as unknown as UserOption;
        return (
          <Group gap="xs">
            <Avatar
              src={userOption.image}
              alt={userOption.label}
              radius="xl"
              size="sm"
            />
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={500}>
                {userOption.label}
              </Text>
              <Text size="xs" c="dimmed">
                {userOption.email}
              </Text>
            </div>
          </Group>
        );
      }}
      {...props}
    />
  );
}
