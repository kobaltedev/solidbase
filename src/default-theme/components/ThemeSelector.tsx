import { Select } from "@kobalte/core/select";
import { isServer } from "solid-js/web";
import {
	type ThemeType,
	getTheme,
	getThemeVariant,
	setTheme,
} from "../../client/theme";
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
	if (!isServer) {
		let theme: string = getThemeVariant();
		if (theme === "system") theme = "system";
		setTheme(theme as ThemeType);
	}

	return (
		<Select<ThemeOption>
			class={styles.root}
			options={THEME_OPTIONS}
			optionValue="value"
			optionTextValue="label"
			value={THEME_OPTIONS.find((t) => t.value === getTheme())}
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
					{(state) => state.selectedOption().label}
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
