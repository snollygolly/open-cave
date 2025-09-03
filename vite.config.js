import { defineConfig } from "vite";

export default defineConfig({
	publicDir: "public",
	base: process.env.NODE_ENV === "production" ? "/open-cave/" : "/",
	server: {
		port: 5173,
		strictPort: true
	},
	build: {
		outDir: "dist",
		sourcemap: true
	}
});