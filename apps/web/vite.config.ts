import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static output only — there is no server to render on (D-048).
export default defineConfig({
  plugins: [react()],
  build: { outDir: "dist", sourcemap: true },
});
