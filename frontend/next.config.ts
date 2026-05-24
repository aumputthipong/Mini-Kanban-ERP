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
};

export default nextConfig;
