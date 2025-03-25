import { Select } from "@kobalte/core/select";
import {
	type ComponentProps,
	type JSX,
	Show,
	children,
	createEffect,
	createSignal,
	onMount,
} from "solid-js";
import {
	type ThemeType,
	getTheme,
	getThemeVariant,
	setTheme,
} from "../../client";
import styles from "./ThemeSelector.module.css";

import IconMoonFill from "~icons/ri/moon-fill";
import IconMoonLine from "~icons/ri/moon-line";
import IconSunFill from "~icons/ri/sun-fill";
import IconSunLine from "~icons/ri/sun-line";

interface ThemeOption {
	value: ThemeType | "system";
	label: string;
	icon: () => JSX.Element;
}

const THEME_OPTIONS: ThemeOption[] = [
	{
		value: "light",
		label: "Light",
		icon: () => <IconSunFill class={styles.icon} aria-hidden />,
	},
	{
		value: "dark",
		label: "Dark",
		icon: () => <IconMoonFill class={styles.icon} aria-hidden />,
	},
	{
		value: "system",
		label: "System",
		icon: () => (
			<div>
				<IconSunLine
					class={`${styles["system-light"]} ${styles["force-light"]}`}
					aria-hidden
				/>
				<IconMoonLine
					class={`${styles["system-dark"]} ${styles["force-dark"]}`}
					aria-hidden
				/>
			</div>
		),
	},
];

export default function ThemeSelector() {
	return (
		<Select<ThemeOption>
			class={styles.root}
			options={THEME_OPTIONS}
			optionValue="value"
			optionTextValue="label"
			value={THEME_OPTIONS.find((t) => t.value === getThemeVariant())}
			onChange={(option) => {
				setTheme(option?.value);
			}}
			allowDuplicateSelectionEvents
			gutter={8}
			sameWidth={false}
			placement="bottom"
			itemComponent={(props) => (
				<Select.Item class={styles.item} item={props.item}>
					<Select.ItemLabel>
						{props.item.rawValue.icon()} {props.item.rawValue.label}
					</Select.ItemLabel>
				</Select.Item>
			)}
		>
			<Select.Trigger class={styles.trigger} aria-label="Change theme mode">
				<Select.Value<ThemeOption>>
					{(state) => (
						<RefreshOnMount aria-label={state.selectedOption().label}>
							<IconSunLine class={styles["system-light"]} aria-hidden />
							<IconMoonLine class={styles["system-dark"]} aria-hidden />
							<IconSunFill class={styles["force-light"]} aria-hidden />
							<IconMoonFill class={styles["force-dark"]} aria-hidden />
						</RefreshOnMount>
					)}
				</Select.Value>
			</Select.Trigger>
			<Select.Portal>
				<Select.Content class={styles.content}>
					<Select.Listbox class={styles.list} />
				</Select.Content>
			</Select.Portal>
		</Select>
	);
}

function RefreshOnMount(props: ComponentProps<"div">) {
	const resolved = children(() => props.children);

	// incorrect value on server with no runtime, refresh on mount to update possibly incorrect label
	const [refresh, setRefresh] = createSignal(false);
	onMount(() => {
		setRefresh(true);
	});

	return (
		<Show when={refresh()} fallback={<div {...props}>{resolved()}</div>} keyed>
			<div {...props}>{resolved()}</div>
		</Show>
	);
}
