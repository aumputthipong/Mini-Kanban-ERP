import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // lucide-react ships every icon as a barrel; rewrite to a per-icon path so
  // unused icons don't get bundled. MUI v7 already ESM tree-shakes; trying to
  // modularize @mui/material breaks subpaths like createTheme/ThemeProvider.
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{kebabCase member}}",
    },
  },
  async redirects() {
    return [
      // /my-tasks was renamed to /my-work in S.1. Permanent redirect so
      // existing bookmarks and the old sidebar entry land on the new page.
      { source: "/my-tasks", destination: "/my-work", permanent: true },
      // Today was folded into My Work — the greeting + stat hero now lead the
      // My Work page, so the standalone /today route redirects there.
      { source: "/today", destination: "/my-work", permanent: true },
    ];
  },
};

export default nextConfig;
