import type { Tab } from "solid-repl";
import CompilerWorker from "solid-repl/dist/compiler?worker";
import FormatterWorker from "solid-repl/dist/formatter?worker";
import SolidRepl from "solid-repl/dist/repl.jsx";

import "solid-repl/dist/bundle.css";

import { createMemo, createSignal, createUniqueId, onCleanup } from "solid-js";

import { getTheme } from "../../client/theme.js";
import type { ReplProps } from "./Repl.jsx";

interface ReplWorkers {
	compiler: Worker;
	formatter: Worker;
}

let workers: ReplWorkers | undefined;
let users = 0;

function useReplWorkers() {
	workers ??= {
		compiler: new CompilerWorker(),
		formatter: new FormatterWorker(),
	};
	users++;

	onCleanup(() => {
		if (--users > 0 || !workers) return;
		workers.compiler.terminate();
		workers.formatter.terminate();
		workers = undefined;
	});

	return workers;
}

export default function ReplClient(props: ReplProps) {
	const { compiler, formatter } = useReplWorkers();

	const id = `sb-repl-${createUniqueId()}`;
	const initialTabs = () => props.tabs.map((tab) => ({ ...tab }));
	const [tabs, setTabs] = createSignal<Tab[]>(initialTabs());

	const dark = createMemo(() => getTheme() === "dark");
	const devtools = () =>
		props.devtools === true ||
		(typeof props.devtools === "string" && props.devtools !== "false");

	return (
		<SolidRepl
			id={id}
			compiler={compiler}
			formatter={formatter}
			dark={dark()}
			tabs={tabs()}
			setTabs={setTabs}
			reset={() => setTabs(initialTabs())}
			hideDevtools={!devtools()}
			vertical={props.layout !== "horizontal"}
		/>
	);
}
