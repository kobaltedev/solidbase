import { solidBaseConfig } from "virtual:solidbase";
import { Select } from "@kobalte/core/select";
import { useMatch, useNavigate } from "@solidjs/router";
import { Show } from "solid-js";

import type { LocaleConfig } from "../../config";
import { useDocumentLocale } from "../locale";
import styles from "./ThemeSelector.module.css";

interface LocaleOption {
	code: string;
	label: string;
}

export default function LocaleSelector() {
	return (
		<Show when={solidBaseConfig.locales}>
			{(locales) => {
				const navigate = useNavigate();

				const locale = useDocumentLocale();

				const getLocaleLink = (locale: {
					code: string;
					config?: LocaleConfig;
				}) =>
					locale.config?.link ??
					`/${locale.code === "root" ? "" : `${locale.code}/`}`;
				const match = useMatch(() => `${getLocaleLink(locale())}*rest`);

				const options = Object.entries(solidBaseConfig.locales ?? {}).map(
					([code, config]) => ({
						code,
						label: config.label,
					}),
				);

				return (
					<Select<LocaleOption>
						class={styles.root}
						value={options.find((o) => o.code === locale().code)}
						options={options}
						optionValue="code"
						optionTextValue="label"
						allowDuplicateSelectionEvents
						onChange={(option) => {
							if (!option) return;

							const searchValue = getLocaleLink({
								code: option.code,
								config: locales()[option.code],
							});

							navigate(`${searchValue}${match()?.params.rest ?? ""}`);
						}}
						gutter={8}
						sameWidth={false}
						placement="bottom"
						itemComponent={(props) => (
							<Select.Item class={styles.item} item={props.item}>
								<Select.ItemLabel>{props.item.rawValue.label}</Select.ItemLabel>
							</Select.Item>
						)}
					>
						<Select.Trigger class={styles.trigger} aria-label="change locale">
							<Select.Value<LocaleOption>>
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
			}}
		</Show>
	);
}
