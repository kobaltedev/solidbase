import { solidBaseConfig } from "virtual:solidbase/config";
import { Select } from "@kobalte/core/select";
import { useNavigate } from "@solidjs/router";
import { createMemo, Show } from "solid-js";
import IconExpandUpDownLine from "~icons/ri/expand-up-down-line";
import { useSolidBaseRoute } from "../../client/index.jsx";
import {
	getSolidBaseRouteFallbackOptions,
	type SolidBaseRouteOption,
} from "../../config/route-config.js";
import styles from "./VersionSelector.module.css";

const VERSION_AXIS = "version";

export default function VersionSelector() {
	const navigate = useNavigate();
	const current = useSolidBaseRoute();
	const options = createMemo(() =>
		getSolidBaseRouteFallbackOptions(
			solidBaseConfig.routes,
			VERSION_AXIS,
			current(),
		),
	);
	const currentOption = createMemo(() =>
		options().find((option) => option.name === current()[VERSION_AXIS]),
	);

	const getOptionLabel = (option: SolidBaseRouteOption) => {
		return typeof option.meta.label === "string"
			? option.meta.label
			: option.name;
	};

	const onChange = (option: SolidBaseRouteOption | null) => {
		if (!option) return;
		if (option.name === current()[VERSION_AXIS]) return;

		if (option.href) {
			globalThis.location.href = option.href;
			return;
		}

		if (option.path) navigate(option.path);
	};

	return (
		<Show when={options().length > 1 && currentOption()}>
			{(value) => (
				<Select<SolidBaseRouteOption>
					class={styles.root}
					value={value()}
					options={options()}
					optionValue="name"
					optionTextValue={getOptionLabel}
					onChange={onChange}
					gutter={8}
					sameWidth={false}
					placement="bottom"
					itemComponent={(props) => (
						<Select.Item class={styles.item} item={props.item}>
							<Select.ItemLabel>
								{getOptionLabel(props.item.rawValue)}
							</Select.ItemLabel>
						</Select.Item>
					)}
				>
					<Select.Trigger class={styles.trigger} aria-label="Change version">
						<Select.Value<SolidBaseRouteOption>>
							{(state) => (
								<div class={styles.labelSegment}>
									{getOptionLabel(state.selectedOption())}
								</div>
							)}
						</Select.Value>
						<Show when={options().length > 1}>
							<div class={styles.iconSegment} aria-hidden>
								<IconExpandUpDownLine class={styles.icon} />
							</div>
						</Show>
					</Select.Trigger>
					<Select.Portal>
						<Select.Content class={styles.content}>
							<Select.Listbox class={styles.list} />
						</Select.Content>
					</Select.Portal>
				</Select>
			)}
		</Show>
	);
}
