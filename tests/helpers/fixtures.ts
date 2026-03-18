import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testRoot = dirname(fileURLToPath(import.meta.url));

export const fixtureSiteRoot = resolve(testRoot, "..", "fixtures");

export function routeFixturePath(...parts: string[]) {
	return resolve(fixtureSiteRoot, "src", "routes", ...parts);
}
