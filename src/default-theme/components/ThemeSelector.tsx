import { Select } from "@kobalte/core/select";
import {
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

interface ThemeOption {
	value: ThemeType | "system";
	label: string;
}

const THEME_OPTIONS: ThemeOption[] = [
	{
		value: "light",
		label: "Light",
	},
	{
		value: "dark",
		label: "Dark",
	},
	{
		value: "system",
		label: "System",
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
					<Select.ItemLabel>{props.item.rawValue.label}</Select.ItemLabel>
				</Select.Item>
			)}
		>
			<Select.Trigger class={styles.trigger} aria-label="toggle color mode">
				<Select.Value<ThemeOption>>
					{(state) => (
						<RefreshOnMount>{state.selectedOption().label}</RefreshOnMount>
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

function RefreshOnMount(props: { children: JSX.Element }) {
	const resolved = children(() => props.children);

	// incorrect value on server with no runtime, refresh on mount to update possibly incorrect label
	const [refresh, setRefresh] = createSignal(false);
	onMount(() => {
		setRefresh(true);
	});

	return (
		<Show when={refresh()} fallback={<div>resolved()</div>} keyed>
			<div>{resolved()}</div>
		</Show>
	);
}
