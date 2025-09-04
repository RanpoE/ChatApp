import type { NextConfig } from "next";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Ensure Turbopack uses the frontend folder as the workspace root.
// This avoids lockfile auto-detection selecting a parent directory.
const rootDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Silence/work around multi-lockfile environments (e.g., a parent yarn.lock)
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory
  turbopack: {
    root: rootDir,
  },
};

export default nextConfig;
