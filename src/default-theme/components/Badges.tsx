import { Badge as KBBadge } from "@kobalte/core/badge";
import { For, type ParentProps, Show } from "solid-js";
import { Dynamic } from "solid-js/web";

import type { BadgeConfig } from "../frontmatter.js";
import type {
	DefaultThemeBadgeIcon,
	DefaultThemeBadgeIconComponent,
	DefaultThemeBadgeIconConfig,
} from "../index.js";
import { useRouteConfig } from "../utils.js";
import styles from "./Badges.module.css";

function isIconComponent(
	icon: DefaultThemeBadgeIcon | undefined,
): icon is DefaultThemeBadgeIconComponent {
	return typeof icon === "function";
}

function isIconConfig(
	icon: DefaultThemeBadgeIcon | undefined,
): icon is DefaultThemeBadgeIconConfig {
	return typeof icon === "object" && icon !== null;
}

function Badge(props: { badge: BadgeConfig }) {
	const config = useRouteConfig();
	const icon = () => {
		const key = props.badge.icon;
		if (!key) return undefined;
		return config().themeConfig?.badges?.icons?.[key];
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
					<div class={styles.badgeIcon} aria-hidden="true" innerHTML={svg()} />
				)}
			</Show>
			<span>{props.badge.label}</span>
		</>
	);

	return (
		<Show
			when={props.badge.url}
			fallback={
				<KBBadge class={styles.badge} textValue={props.badge.label}>
					{content()}
				</KBBadge>
			}
		>
			{(url) => (
				<KBBadge
					as="a"
					class={`${styles.badge} ${styles.badgeLink}`}
					href={url()}
					target={url().includes("//") ? "_blank" : undefined}
					rel={url().includes("//") ? "noopener noreferrer" : undefined}
					textValue={props.badge.label}
				>
					{content()}
				</KBBadge>
			)}
		</Show>
	);
}

export default function Badges(
	props: ParentProps<{ badges?: Array<BadgeConfig> }>,
) {
	return (
		<Show when={props.badges?.length}>
			<div class={styles.badges}>
				<For each={props.badges}>{(badge) => <Badge badge={badge} />}</For>
				{props.children}
			</div>
		</Show>
	);
}
