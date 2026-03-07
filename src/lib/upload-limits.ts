// Shared upload limits importable by both server and client code.
// storage.ts re-exports these for server consumers; client components
// import directly from here to avoid the 'server-only' guard.

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_FILE_SIZE_DISPLAY = '10MB';
