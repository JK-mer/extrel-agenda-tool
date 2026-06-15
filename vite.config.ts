import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative base so the build works under any path, incl. the GitHub Pages
  // project subpath (https://<user>.github.io/extrel-agenda-tool/).
  base: "./",
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
});
