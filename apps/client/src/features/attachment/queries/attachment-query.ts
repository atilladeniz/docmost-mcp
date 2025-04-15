import { api } from "@/lib/api";
import { IAttachment, IPagination } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

interface AttachmentsQueryParams {
  page?: number;
  limit?: number;
  spaceId?: string;
  pageId?: string;
  type?: string;
  query?: string;
}

// Function to fetch attachments
export const fetchAttachments = async (
  params: AttachmentsQueryParams = {}
): Promise<IPagination<IAttachment>> => {
  const { page = 1, limit = 20, spaceId, pageId, type, query } = params;

  const queryParams = new URLSearchParams();
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());

  if (spaceId) queryParams.append("spaceId", spaceId);
  if (pageId) queryParams.append("pageId", pageId);
  if (type) queryParams.append("type", type);
  if (query) queryParams.append("query", query);

  const response = await api.get(`/attachments?${queryParams.toString()}`);
  return response;
};

// Hook for using the attachments query
export const useAttachmentsQuery = (params: AttachmentsQueryParams = {}) => {
  const { page = 1, limit = 20, spaceId, pageId, type, query } = params;

  return useQuery({
    queryKey: ["attachments", { page, limit, spaceId, pageId, type, query }],
    queryFn: () => fetchAttachments(params),
  });
};
