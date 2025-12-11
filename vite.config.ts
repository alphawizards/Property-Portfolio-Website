import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import "dotenv/config"; // Load env vars

const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];

const alias: Record<string, string> = {
  "@": path.resolve(import.meta.dirname, "client", "src"),
  "@shared": path.resolve(import.meta.dirname, "shared"),
  "@assets": path.resolve(import.meta.dirname, "attached_assets"),
};

if (process.env.VITE_ENABLE_MOCK_AUTH === "true") {
  console.log("⚠️  Mock Auth Enabled: Aliasing @clerk/clerk-react to mock implementation");
  alias["@clerk/clerk-react"] = path.resolve(import.meta.dirname, "client/src/lib/mock-clerk-react.tsx");
}

export default defineConfig({
  plugins,
  resolve: {
    alias,
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
