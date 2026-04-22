import { Select } from "@kobalte/core/select";
import { Show } from "solid-js";

import { type ResolvedLocale, useLocale } from "../../client/index.jsx";
import styles from "./ThemeSelector.module.css";

export default function LocaleSelector<ThemeConfig>() {
	const locale = useLocale();

	return (
		<Show when={locale.locales.length > 1}>
			{(_) => {
				return (
					<Select<ResolvedLocale<ThemeConfig>>
						class={styles.root}
						value={locale.currentLocale()}
						options={locale.locales}
						optionValue="code"
						optionTextValue={(v) => v.config.label}
						allowDuplicateSelectionEvents
						onChange={(option) => option && locale.setLocale(option)}
						gutter={8}
						sameWidth={false}
						placement="bottom"
						itemComponent={(props) => (
							<Select.Item class={styles.item} item={props.item}>
								<Select.ItemLabel>
									{props.item.rawValue.config.label}
								</Select.ItemLabel>
							</Select.Item>
						)}
					>
						<Select.Trigger class={styles.trigger} aria-label="change locale">
							<Select.Value<ResolvedLocale<ThemeConfig>>>
								{(state) => state.selectedOption().config.label}
							</Select.Value>
						</Select.Trigger>
						<Select.Portal>
							<Select.Content class={styles.content}>
								<Select.Listbox class={styles.list} />
							</Select.Content>
						</Select.Portal>
					</Select>
				);
			}}
		</Show>
	);
}
