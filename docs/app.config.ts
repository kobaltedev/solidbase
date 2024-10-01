import { defineConfig } from "@solidjs/start/config";
import { withSolidBase } from "../src";

export default defineConfig(
  withSolidBase({
    ssr: true,
  }),
);
