export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
  defaultPage?: number;
}

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Safely parses and bounds pagination parameters (page, limit).
 * Protects Prisma queries from integer overflow, NaN, negative offset errors, and DoS from excessive limits.
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  options?: PaginationOptions
): ParsedPagination {
  const defaultLimit = options?.defaultLimit ?? 50;
  const maxLimit = options?.maxLimit ?? 200;
  const defaultPage = options?.defaultPage ?? 1;

  // Safe parse page
  const rawPageStr = searchParams.get('page');
  const rawPage = rawPageStr ? parseInt(rawPageStr, 10) : defaultPage;
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : defaultPage;

  // Safe parse limit with strict bounding [1, maxLimit]
  const rawLimitStr = searchParams.get('limit');
  const rawLimit = rawLimitStr ? parseInt(rawLimitStr, 10) : defaultLimit;
  const validLimit = Number.isFinite(rawLimit) ? rawLimit : defaultLimit;
  const limit = Math.min(Math.max(1, validLimit), maxLimit);

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}
