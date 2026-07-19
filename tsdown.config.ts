import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts", "./src/index.serverless.ts"],
  minify: true,
});
