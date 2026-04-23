import { Accordion } from "@kobalte/core/accordion";
import { For } from "solid-js";

const accordionItems = [
	{
		value: "item-1",
		title: "Is it accessible?",
		body: "Yes. It follows the WAI-ARIA accordion pattern and supports keyboard navigation.",
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
	return (
			<div class="sb-preview-demo-accordion-wrap">
				<Accordion
					class="sb-preview-demo-accordion"
					defaultValue={["item-1"]}
					collapsible
				>
				<For each={accordionItems}>
					{(item) => (
						<Accordion.Item class="sb-preview-demo-item" value={item.value}>
							<Accordion.Header class="sb-preview-demo-header">
								<Accordion.Trigger class="sb-preview-demo-trigger">
									<span>{item.title}</span>
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="chevron-icon"><path fill="currentColor" d="m12 13.171l4.95-4.95l1.414 1.415L12 16L5.636 9.636L7.05 8.222z"/></svg>
								</Accordion.Trigger>
							</Accordion.Header>
							<Accordion.Content class="sb-preview-demo-content">
								<p>{item.body}</p>
							</Accordion.Content>
						</Accordion.Item>
					)}
				</For>
				</Accordion>
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
