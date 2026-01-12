/**
 * Canonical pagination helper for Stremio
 * DO NOT modify once pagination works
 */
export function paginatePool(pool, skip, limit) {
  const safeSkip = Number(skip) || 0;
  const safeLimit = Number(limit) || 20;

  // 🔑 FILTER FIRST (never after slicing)
  const filtered = pool.filter(Boolean);

  // 🔑 SLICE limit + 1
  const slice = filtered.slice(safeSkip, safeSkip + safeLimit + 1);

  return {
    slice,
    hasMore: slice.length > safeLimit
  };
}
