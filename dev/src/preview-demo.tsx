import { createUniqueId, For } from "solid-js";

function ChevronDownIcon(props: { class?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			class={props.class}
			aria-hidden="true"
		>
			<path
				fill="currentColor"
				d="m12 13.171 4.95-4.95 1.414 1.415L12 16 5.636 9.636 7.05 8.222z"
			/>
		</svg>
	);
}

const accordionItems = [
	{
		value: "item-1",
		title: "Is it accessible?",
		body: "Yes. Native disclosure elements support keyboard and screen reader navigation.",
	},
	{
		value: "item-2",
		title: "Is it unstyled?",
		body: "Yes. The example styling is local to the dev app so theme authors can review the shell in isolation.",
	},
	{
		value: "item-3",
		title: "Does it hold up on mobile?",
		body: "The trigger rows keep their tap targets and the stage allows horizontal overflow when a demo needs it.",
	},
];

export function PreviewAccordionExample() {
	const name = createUniqueId();
	return (
		<div class="sb-preview-demo-accordion-wrap">
			<style>{`.sb-preview-demo-trigger::-webkit-details-marker { display: none; }
.sb-preview-demo-trigger .sb-preview-demo-header { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 1rem; margin: 0; font: inherit; }
.sb-preview-demo-item[open] > .sb-preview-demo-trigger .chevron-icon { transform: rotate(180deg); }`}</style>
			<div class="sb-preview-demo-accordion">
				<For each={accordionItems}>
					{(item) => (
						<details
							class="sb-preview-demo-item"
							name={name}
							open={item.value === "item-1"}
						>
							<summary class="sb-preview-demo-trigger">
								<h3 class="sb-preview-demo-header">
									<span>{item.title}</span>
									<ChevronDownIcon class="chevron-icon" />
								</h3>
							</summary>
							<div class="sb-preview-demo-content">
								<p>{item.body}</p>
							</div>
						</details>
					)}
				</For>
			</div>
		</div>
	);
}

const cardItems = [
	{
		title: "Preview-only",
		body: "Shows the dark stage without the lighter supporting panel.",
	},
	{
		title: "Responsive",
		body: "Cards wrap and keep enough breathing room on narrow viewports.",
	},
	{
		title: "Theme-aware",
		body: "The stage shell adapts to light and dark theme variables.",
	},
];

export function PreviewCardsExample() {
	return (
		<div class="sb-preview-demo-cards">
			<For each={cardItems}>
				{(item) => (
					<article class="sb-preview-demo-card">
						<span class="sb-preview-demo-card-kicker">Preview</span>
						<h3>{item.title}</h3>
						<p>{item.body}</p>
					</article>
				)}
			</For>
		</div>
	);
}
