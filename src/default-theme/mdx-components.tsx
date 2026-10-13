import {
	cookieStorage,
	makePersisted,
	messageSync,
} from "@solid-primitives/storage";
import type { ComponentProps } from "@solidjs/web";
import { isServer } from "@solidjs/web";
import {
	children,
	createEffect,
	createSignal,
	createUniqueId,
	For,
	omit,
	onCleanup,
	type ParentProps,
	Show,
	type Signal,
} from "solid-js";
import { usePreferredLanguage } from "../client/preferred-language.js";
import CopyPageLink from "../default-theme/components/CopyPageLink.jsx";
import { Preview, PreviewPanel, PreviewStage } from "./components/Preview.jsx";
import { useDefaultThemeComponents } from "./context.jsx";
import { useDefaultThemeFrontmatter } from "./frontmatter.js";
import styles from "./mdx-components.module.css";

export function h1(props: ComponentProps<"h1">) {
	const frontmatter = useDefaultThemeFrontmatter();
	const { Badges } = useDefaultThemeComponents();

	return (
		<div class={styles.actions}>
			<div class={styles.title}>
				<h1 class={styles.h1} {...props} />
				<Show when={frontmatter()?.copyButton !== false}>
					<div class={styles.pageAction}>
						<CopyPageLink />
					</div>
				</Show>
			</div>
			<Badges badges={frontmatter()?.badges} />
		</div>
	);
}

export function h2(props: ComponentProps<"h2">) {
	return <h2 class={styles.h2} {...props} />;
}

export function h3(props: ComponentProps<"h3">) {
	return <h3 class={styles.h3} {...props} />;
}

export function h4(props: ComponentProps<"h4">) {
	return <h4 class={styles.h4} {...props} />;
}

export function h5(props: ComponentProps<"h5">) {
	return <h5 class={styles.h5} {...props} />;
}

export function h6(props: ComponentProps<"h6">) {
	return <h6 class={styles.h6} {...props} />;
}

export function a(props: ComponentProps<"a"> & { "data-auto-heading"?: "" }) {
	const outbound = () => String(props.href ?? "").includes("//");
	const autoHeading = () => props["data-auto-heading"] === "";

	return (
		<a
			target={outbound() ? "_blank" : undefined}
			rel={outbound() ? "noopener noreferrer" : undefined}
			class={autoHeading() ? styles["a-auto"] : styles.a}
			href={props.href ?? ""}
			{...props}
		/>
	);
}

export function code(props: ComponentProps<"code">) {
	return <code class={styles.code} {...props} />;
}

export function hr(props: ComponentProps<"hr">) {
	return <hr class={styles.hr} {...props} />;
}

export function table(props: ComponentProps<"table">) {
	const others = omit(props, "class");

	return (
		<div class={styles.table}>
			<table {...others} />
		</div>
	);
}

export function blockquote(props: ComponentProps<"blockquote">) {
	return <blockquote class={styles.blockquote} {...props} />;
}

export function p(props: ComponentProps<"p">) {
	return <p class={styles.p} {...props} />;
}

export function li(props: ComponentProps<"li">) {
	return <li class={styles.li} {...props} />;
}

export function ul(props: ComponentProps<"ul">) {
	return <ul class={styles.ul} {...props} />;
}

export function ol(props: ComponentProps<"ol">) {
	return <ol class={styles.ol} {...props} />;
}

export function DirectiveContainer(
	props: {
		type:
			| "info"
			| "note"
			| "tip"
			| "important"
			| "warning"
			| "danger"
			| "caution"
			| "details"
			| "tab-group"
			| "tab";
		title?: string;
		codeGroup?: string;
		tabNames?: string;
		withTsJsToggle?: string;
	} & ParentProps,
) {
	const _children = children(() => props.children).toArray();

	if (props.type === "tab") {
		return _children;
	}

	if (props.type === "tab-group") {
		const tabNames = props.tabNames?.split("\0") ?? [];
		const [preferredLanguage] = usePreferredLanguage();
		const id = createUniqueId();
		const state = createSignal(tabNames[0] ?? "");
		const [openTab, setOpenTab] = state;
		if (props.title) {
			// Sync across tabs on the client only; close the channel with the group.
			const channel = isServer ? undefined : new BroadcastChannel("tab-group");
			if (channel) onCleanup(() => channel.close());
			const [, persistTab] = makePersisted<string, Signal<string>>(state, {
				name: `tab-group:${props.title}`,
				sync: channel && messageSync(channel),
				storage: cookieStorage.withOptions({
					expires: new Date(Date.now() + 3e10),
				}),
			});
			// Persist the committed selection, not the old value visible in its event frame.
			createEffect(
				openTab,
				(value) => {
					persistTab(value);
				},
				{ defer: true },
			);
		}
		const selected = () =>
			tabNames.includes(openTab()) ? openTab() : tabNames[0];

		return (
			<div class={styles["tabs-container"]}>
				<div
					role="tablist"
					aria-label={props.title || "Tabs"}
					aria-orientation="horizontal"
					class={styles["tabs-list"]}
					onKeyDown={(event) => {
						const triggers = Array.from(
							event.currentTarget.querySelectorAll<HTMLButtonElement>(
								'[role="tab"]',
							),
						);
						const index = triggers.indexOf(event.target as HTMLButtonElement);
						if (index === -1 || event.altKey || event.ctrlKey || event.metaKey)
							return;
						const rtl =
							getComputedStyle(event.currentTarget).direction === "rtl";
						let next: number;
						switch (event.key) {
							case "ArrowRight":
								next = index + (rtl ? -1 : 1);
								break;
							case "ArrowLeft":
								next = index + (rtl ? 1 : -1);
								break;
							case "Home":
								next = 0;
								break;
							case "End":
								next = triggers.length - 1;
								break;
							default:
								return;
						}
						event.preventDefault();
						next = (next + triggers.length) % triggers.length;
						setOpenTab(tabNames[next]!);
						triggers[next]!.focus();
					}}
				>
					{tabNames.map((title, index) => {
						const jsTitle = title.replace(/\.tsx?$/, (ext) => {
							if (ext === ".tsx") {
								return ".jsx";
							}
							if (ext === ".ts") {
								return ".js";
							}
							return ext;
						});

						return (
							<button
								type="button"
								role="tab"
								id={`${id}-tab-${index}`}
								aria-controls={`${id}-panel-${index}`}
								aria-selected={selected() === title ? "true" : "false"}
								tabindex={selected() === title ? 0 : -1}
								data-selected={selected() === title ? "" : undefined}
								class={styles["tabs-trigger"]}
								onClick={() => setOpenTab(title)}
							>
								{preferredLanguage() === "ts" ? title : jsTitle}
								<span
									aria-hidden="true"
									class={styles["tabs-indicator"]}
									style={{
										width: "100%",
										display: selected() === title ? "block" : "none",
									}}
								/>
							</button>
						);
					})}
					{props.withTsJsToggle === "true" && (
						<input
							type="checkbox"
							checked
							title="Toggle language"
							aria-label="Toggle TS/JS"
							class="sb-ts-js-toggle"
						/>
					)}
				</div>

				<For each={tabNames}>
					{(title, i) => (
						<div
							role="tabpanel"
							id={`${id}-panel-${i()}`}
							aria-labelledby={`${id}-tab-${i()}`}
							tabindex={0}
							hidden={selected() !== title}
							data-selected={selected() === title ? "" : undefined}
							class={styles["tabs-content"]}
						>
							<div>{_children[i()]}</div>
						</div>
					)}
				</For>
			</div>
		);
	}

	if (props.type === "details") {
		return (
			<details
				class={styles["custom-container"]}
				data-custom-container="details"
			>
				<summary>{props.title ?? props.type}</summary>
				{_children}
			</details>
		);
	}

	return (
		<div class={styles["custom-container"]} data-custom-container={props.type}>
			<Show when={props.title !== " "}>
				<span>{props.title ?? props.type}</span>
			</Show>
			{_children}
		</div>
	);
}

export { Preview, PreviewPanel, PreviewStage };

export function Steps(props: ParentProps) {
	return <div class={styles.steps}>{props.children}</div>;
}

export function Step(props: ParentProps) {
	return <div class={styles.step}>{props.children}</div>;
}
