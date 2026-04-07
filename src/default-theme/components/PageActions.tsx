import { Badge } from "@kobalte/core/badge";
import { type ParentProps, For, Show } from "solid-js";
import { Dynamic } from "solid-js/web";

import type { PageActionConfig } from "../frontmatter.js";
import type {
	DefaultThemeActionIcon,
	DefaultThemeActionIconConfig,
	DefaultThemeActionIconComponent,
} from "../index.js";
import { useRouteConfig } from "../utils.js";
import styles from "./PageActions.module.css";

function isIconComponent(
	icon: DefaultThemeActionIcon | undefined,
): icon is DefaultThemeActionIconComponent {
	return typeof icon === "function";
}

function isIconConfig(
	icon: DefaultThemeActionIcon | undefined,
): icon is DefaultThemeActionIconConfig {
	return typeof icon === "object" && icon !== null;
}

function PageActionBadge(props: { action: PageActionConfig }) {
	const config = useRouteConfig();
	const icon = () => {
		const key = props.action.icon;
		if (!key) return undefined;
		return config().themeConfig?.actions?.icons?.[key];
	};
	const iconSvg = () => {
		const value = icon();
		if (typeof value === "string") return value;
		if (isIconConfig(value) && "svg" in value) return value.svg;
		return undefined;
	};
	const iconComponent = () => {
		const value = icon();
		if (isIconComponent(value)) return value;
		if (isIconConfig(value) && "component" in value) return value.component;
		return undefined;
	};
	const content = () => (
		<>
			<Show when={iconComponent()}>
				{(Icon) => <Dynamic component={Icon()} class={styles.badgeIcon} />}
			</Show>
			<Show when={iconSvg()}>
				{(svg) => (
					<div
						class={styles.badgeIcon}
						aria-hidden="true"
						innerHTML={svg()}
					/>
				)}
			</Show>
			<span>{props.action.label}</span>
		</>
	);

	return (
		<Show
			when={props.action.url}
			fallback={
				<Badge class={styles.badge} textValue={props.action.label}>
					{content()}
				</Badge>
			}
		>
			{(url) => (
				<Badge
					as="a"
					class={`${styles.badge} ${styles.badgeLink}`}
					href={url()}
					target={url().includes("//") ? "_blank" : undefined}
					rel={url().includes("//") ? "noopener noreferrer" : undefined}
					textValue={props.action.label}
				>
					{content()}
				</Badge>
			)}
		</Show>
	);
}

export default function PageActions(
	props: ParentProps<{ actions?: Array<PageActionConfig> }>,
) {
	return (
		<Show when={props.actions?.length}>
			<div class={styles.badges}>
				<For each={props.actions}>{(action) => <PageActionBadge action={action} />}</For>
				{props.children}
			</div>
		</Show>
	);
}
