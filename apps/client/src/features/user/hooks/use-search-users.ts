import { useQuery } from "@tanstack/react-query";
import { getWorkspaceUsers } from "../services/user-service";
import { IUser } from "../types/user.types";
import { IPagination } from "@/lib/types";

const USERS_QUERY_KEY = "workspace-users";

interface UseSearchUsersParams {
  query?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export function useSearchUsers({
  query,
  page = 1,
  limit = 20,
  enabled = true,
}: UseSearchUsersParams = {}) {
  return useQuery<IPagination<IUser>>({
    queryKey: [USERS_QUERY_KEY, { query, page, limit }],
    queryFn: () => getWorkspaceUsers({ query, page, limit }),
    enabled,
  });
}
