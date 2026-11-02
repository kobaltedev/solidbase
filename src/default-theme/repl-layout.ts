import type { ReplStorage, Tab } from "solid-repl";

type ReplLayout = NonNullable<
	ReturnType<NonNullable<ReplStorage["getLayout"]>>
>;

// solid-repl's default desktop layout, except that it only opens the entry file. The other
// files are only reachable through the "+" (New Tab) view, so open them all as tabs with
// the entry file active.
export function createReplLayout(tabs: Tab[], vertical: boolean): ReplLayout {
	const files = tabs
		// solid-repl adds this one itself and doesn't treat it as a lesson file.
		.filter((tab) => tab.name !== "import_map.json")
		.map((tab) => ({ id: tab.id ?? `name:${tab.name}`, title: tab.name }));
	const entry = files.find((file) => file.title === "main.tsx") ?? files[0];

	return {
		grid: {
			root: {
				type: "branch",
				data: [
					{
						type: "leaf",
						data: {
							views: files.map((file) => file.id),
							activeView: entry?.id,
							id: "1",
						},
						size: 400,
					},
					{
						type: "leaf",
						data: {
							views: ["Preview", "Output"],
							activeView: "Preview",
							id: "2",
						},
						size: 250,
					},
				],
				size: 480,
			},
			width: 1600,
			height: 480,
			// Dockview's Orientation enum; dockview is only a dependency of solid-repl.
			orientation: (vertical ? "VERTICAL" : "HORIZONTAL") as never,
		},
		activeGroup: "1",
		panels: {
			Preview: {
				id: "Preview",
				contentComponent: "preview",
				tabComponent: "default",
				renderer: "always",
			},
			Output: {
				id: "Output",
				contentComponent: "output",
				tabComponent: "default",
			},
			...Object.fromEntries(
				files.map((file) => [
					file.id,
					{
						...file,
						tabComponent: "file",
						contentComponent: "editor",
					},
				]),
			),
		},
	};
}
