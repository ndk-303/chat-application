import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // bind to 0.0.0.0 so Docker can expose the port
    port: 5173,
    allowedHosts: true, // cho phép ngrok và bất kỳ hostname nào
  },

});
