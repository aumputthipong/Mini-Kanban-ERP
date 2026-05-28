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
      // /today exists in the sidebar but its focused page lands in S.2.
      // Until then, alias it to the "today" filter on My Work so the link
      // is functional and bookmarks won't break when the real page ships.
      { source: "/today", destination: "/my-work?filter=today", permanent: false },
    ];
  },
};

export default nextConfig;
