export function paginatePool(pool, skip, limit) {
  const safeSkip = Number(skip) || 0;
  const safeLimit = Number(limit) || 20;

  // 🔒 HARD GUARD — NEVER crash Stremio
  if (!Array.isArray(pool)) {
    return { slice: [], hasMore: false };
  }

  const filtered = pool.filter(Boolean);
  const slice = filtered.slice(safeSkip, safeSkip + safeLimit + 1);

  return {
    slice,
    hasMore: slice.length > safeLimit
  };
}
