import { EventEmitter } from "node:events";
import { dirname } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const existsSync = vi.fn();
const spawn = vi.fn();

vi.mock("node:fs", () => ({
	default: {
		existsSync,
	},
}));

vi.mock("cross-spawn", () => ({
	spawn,
}));

function createChild(output: string) {
	const child = new EventEmitter() as EventEmitter & {
		stdout: EventEmitter;
	};
	child.stdout = new EventEmitter();

	queueMicrotask(() => {
		child.stdout.emit("data", output);
		child.emit("close");
	});

	return child;
}

describe("getGitTimestamp", () => {
	const missingPath = "tests/fixtures/missing.mdx";
	const docPath = "tests/fixtures/doc.mdx";
	const errorPath = "tests/fixtures/error.mdx";

	beforeEach(() => {
		vi.resetModules();
		existsSync.mockReset();
		spawn.mockReset();
	});

	it("returns 0 for missing files without spawning git", async () => {
		existsSync.mockReturnValue(false);
		const { getGitTimestamp } = await import("../../src/config/git.ts");

		expect(getGitTimestamp(missingPath)).toBe(0);
		expect(spawn).not.toHaveBeenCalled();
	});

	it("spawns git once and caches successful timestamps", async () => {
		existsSync.mockReturnValue(true);
		spawn.mockImplementation(() => createChild("2024-01-02 03:04:05 +0000"));
		const { getGitTimestamp } = await import("../../src/config/git.ts");

		await expect(getGitTimestamp(docPath)).resolves.toBe(
			+new Date("2024-01-02 03:04:05 +0000"),
		);
		expect(getGitTimestamp(docPath)).toBe(
			+new Date("2024-01-02 03:04:05 +0000"),
		);
		expect(spawn).toHaveBeenCalledTimes(1);
		expect(spawn).toHaveBeenCalledWith(
			"git",
			["log", "-1", '--pretty="%ai"', "doc.mdx"],
			{ cwd: dirname(docPath) },
		);
	});

	it("rejects when git spawning errors", async () => {
		existsSync.mockReturnValue(true);
		spawn.mockImplementation(() => {
			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
			};
			child.stdout = new EventEmitter();
			queueMicrotask(() => child.emit("error", new Error("git failed")));
			return child;
		});
		const { getGitTimestamp } = await import("../../src/config/git.ts");

		await expect(getGitTimestamp(errorPath)).rejects.toThrow("git failed");
	});
});
