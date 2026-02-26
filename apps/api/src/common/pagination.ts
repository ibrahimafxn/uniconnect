export function parsePagination(query: {
  page?: string;
  limit?: string;
}): { page: number; limit: number; skip: number } {
  const pageRaw = Number.parseInt(query.page ?? '1', 10);
  const limitRaw = Number.parseInt(query.limit ?? '20', 10);

  const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
  const limit = Number.isNaN(limitRaw) || limitRaw < 1 ? 20 : Math.min(100, limitRaw);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}
