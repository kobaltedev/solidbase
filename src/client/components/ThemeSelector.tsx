import { Select } from "@kobalte/core/select";
import { type ThemeType, getTheme, setTheme } from "../theme";
import styles from "./ThemeSelector.module.css";

interface ThemeOption {
	value: ThemeType | undefined;
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
		value: undefined,
		label: "System",
	},
];

export default function ThemeSelector() {
	return (
		<Select<ThemeOption>
			options={THEME_OPTIONS}
			optionValue="value"
			optionTextValue="label"
			value={THEME_OPTIONS.find((t) => t.value === getTheme())}
			onChange={(option) => {
				setTheme(option?.value);
			}}
			gutter={8}
			sameWidth={false}
			placement="bottom"
			itemComponent={(props) => (
				<Select.Item item={props.item}>
					<Select.ItemLabel>{props.item.rawValue.label}</Select.ItemLabel>
				</Select.Item>
			)}
		>
			<Select.Trigger aria-label="toggle color mode">
				<Select.Value<ThemeOption>>
					{(state) => state.selectedOption().label}
				</Select.Value>
			</Select.Trigger>
			<Select.Portal>
				<Select.Content>
					<Select.Listbox />
				</Select.Content>
			</Select.Portal>
		</Select>
	);
}
