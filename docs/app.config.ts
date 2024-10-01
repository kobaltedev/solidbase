import { defineConfig } from "@solidjs/start/config";
import { withSolidBase } from "../src/config";

export default defineConfig(
	withSolidBase(
		{ ssr: true },
		{
			title: "SolidBase",
			description: "Solid Start Powered Static Site Generator",
		},
	),
);
