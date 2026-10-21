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
						// Kobalte re-emits onChange for the kept selection whenever `options`
						// changes (every navigation rebuilds `locales`). Only an actual locale
						// switch may navigate: re-navigating to the current locale pushes a
						// history entry when the URL is spelled differently (e.g. Netlify's
						// trailing slash after Back), which drops the Forward entries.
						onChange={(option) =>
							option &&
							option.code !== locale.currentLocale().code &&
							locale.setLocale(option)
						}
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
