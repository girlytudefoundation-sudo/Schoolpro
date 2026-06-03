import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const isBuild = process.env.NODE_ENV === "production" || process.argv.includes("build");
const isReplit = process.env.REPL_ID !== undefined;

const port = Number(process.env.PORT ?? 3000);
const basePath = process.env.BASE_PATH ?? "/";

if (!isBuild && isReplit && !process.env.PORT) {
  throw new Error("PORT environment variable is required but was not provided.");
}

export default async (): Promise<any> => {
  const basePlugins = [react(), tailwindcss()];

  let additionalPlugins: any[] = [];
  
  if (!isBuild && isReplit) {
    try {
      const runtimeErrorModal = await import("@replit/vite-plugin-runtime-error-modal");
      const cartographerModule = await import("@replit/vite-plugin-cartographer");
      const devBannerModule = await import("@replit/vite-plugin-dev-banner");
      
      additionalPlugins = [
        runtimeErrorModal.default(),
        cartographerModule.cartographer({ root: path.resolve(import.meta.dirname, "..") }),
        devBannerModule.devBanner(),
      ];
    } catch (error) {
      console.warn("Failed to load Replit plugins, continuing without them", error);
    }
  }

  return defineConfig({
    base: basePath,
    plugins: [...basePlugins, ...additionalPlugins],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: { strict: true },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  });
};