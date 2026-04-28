import { Popover } from "@kobalte/core/popover";
import { createMemo, createSignal, For, Show } from "solid-js";
import IconExpandUpDownLine from "~icons/ri/expand-up-down-line";
import { useSolidBaseRoute } from "../../client/index.jsx";
import {
	getSolidBaseRouteFallbackOptions,
	type SolidBaseRouteOption,
} from "../../config/route-config.js";
import { useRouteConfig } from "../utils.js";
import styles from "./VersionSelector.module.css";

const VERSION_AXIS = "version";

export default function VersionSelector() {
	const [open, setOpen] = createSignal(false);

	const config = useRouteConfig();

	const current = useSolidBaseRoute();
	const options = createMemo(() =>
		getSolidBaseRouteFallbackOptions(config().routes, VERSION_AXIS, current()),
	);
	const currentOption = createMemo(() =>
		options().find((option) => option.name === current()[VERSION_AXIS]),
	);

	const getOptionLabel = (option: SolidBaseRouteOption) => {
		return typeof option.meta.label === "string"
			? option.meta.label
			: option.name;
	};

	return (
		<Show when={currentOption()}>
			{(current) => (
				<Popover
					open={open()}
					onOpenChange={setOpen}
					gutter={4}
					sameWidth
					placement="bottom-start"
				>
					<Popover.Trigger
						class={styles.trigger}
						aria-label="Change version"
						disabled={options().length <= 1}
					>
						<span class={styles.label}>{getOptionLabel(current())}</span>

						<Show when={options().length > 1}>
							<IconExpandUpDownLine class={styles.icon} aria-hidden />
						</Show>
					</Popover.Trigger>
					<Popover.Portal>
						<Popover.Content class={styles.content}>
							<For each={options()}>
								{(option) => {
									const outbound = () => !!option.href;

									return (
										<a
											class={styles.item}
											target={outbound() ? "_blank" : undefined}
											rel={outbound() ? "noopener noreferrer" : undefined}
											aria-current={option === currentOption() || undefined}
											href={option.href ?? option.path}
											onMouseEnter={(e) => e.currentTarget.focus()}
											onClick={() => setOpen(false)}
										>
											{getOptionLabel(option)}
										</a>
									);
								}}
							</For>
						</Popover.Content>
					</Popover.Portal>
				</Popover>
			)}
		</Show>
	);
}
