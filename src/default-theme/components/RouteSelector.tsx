import { solidBaseConfig } from "virtual:solidbase/config";
import { Select } from "@kobalte/core/select";
import { useLocation, useNavigate } from "@solidjs/router";
import { createMemo, For, Show } from "solid-js";

import {
	getSolidBaseRouteMatchForPath,
	getSolidBaseRoutePathWithRest,
	isSolidBaseRouteAxisConfig,
	type SolidBaseRouteOption,
} from "../../config/route-config.js";
import {
	useSolidBaseRoute,
	useSolidBaseRouteOptions,
} from "../../client/index.jsx";
import styles from "./ThemeSelector.module.css";

const LOCALE_AXIS = "locale";

export default function RouteSelector() {
	const axes = createMemo(() => {
		const routes = solidBaseConfig.routes;
		if (!routes) return [];

		return Object.entries(routes)
			.filter(([name, value]) => {
				return name !== LOCALE_AXIS && isSolidBaseRouteAxisConfig(value);
			})
			.map(([name]) => name);
	});

	return <For each={axes()}>{(axis) => <RouteAxisSelector axis={axis} />}</For>;
}

function RouteAxisSelector(props: { axis: string }) {
	const location = useLocation();
	const navigate = useNavigate();
	const current = useSolidBaseRoute();
	const options = useSolidBaseRouteOptions(props.axis);
	const currentOption = createMemo(() =>
		options().find((option) => option.name === current()[props.axis]),
	);

	const getOptionLabel = (option: SolidBaseRouteOption) => {
		return typeof option.meta.label === "string" ? option.meta.label : option.name;
	};

	const getOptionPath = (option: SolidBaseRouteOption) => {
		if (!option.selection) return undefined;

		return getSolidBaseRoutePathWithRest(
			solidBaseConfig.routes,
			option.selection,
			getSolidBaseRouteMatchForPath(
				solidBaseConfig.routes,
				location.pathname,
			)?.restPath ?? "/",
		);
	};

	const onChange = (option: SolidBaseRouteOption | null) => {
		if (!option) return;
		if (option.href) {
			globalThis.location.href = option.href;
			return;
		}

		const path = getOptionPath(option);
		if (path) navigate(path);
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
					allowDuplicateSelectionEvents
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
					<Select.Trigger
						class={styles.trigger}
						aria-label={`Change ${props.axis}`}
					>
						<Select.Value<SolidBaseRouteOption>>
							{(state) => getOptionLabel(state.selectedOption())}
						</Select.Value>
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
