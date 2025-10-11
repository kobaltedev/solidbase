import {
	PluginStyleSettings,
	type ResolverContext,
} from "@expressive-code/core";
import type { EcPluginLanguageSwitcherOptions } from "./index.js";

export type LanguageSwitcherStyleSettings = {
	/**
	 * The background color of the language switcher toggle button.
	 * @default "transparent"
	 */
	toggleButtonBackground: string;
	/**
	 * The background color of the language switcher toggle button when hovered.
	 * @default
	 * ({ theme }) => (theme.type === "dark" ? "#27272a" : "#f6f6f7")
	 */
	toggleButtonBackgroundHover: string;
	/**
	 * The foreground color (e.g., text and icons) of the language switcher toggle button.
	 * @default
	 * ({ theme }) => theme.colors["tab.activeForeground"]
	 */
	toggleButtonForeground: string;
	/**
	 * The opacity of the active language label in the toggle button.
	 * @default "1"
	 */
	toggleButtonOpacityActive: string;
	/**
	 * The opacity of the inactive language label in the toggle button.
	 * @default "0.4"
	 */
	toggleButtonOpacityInactive: string;
	/**
	 * The border of the language switcher toggle button.
	 * @default "1px solid transparent"
	 */
	toggleButtonBorder: string;
	/**
	 * The border radius of the language switcher toggle button.
	 * @default "0.2rem"
	 */
	toggleButtonBorderRadius: string;
};

declare module "@expressive-code/core" {
	export interface StyleSettings {
		languageSwitcher: LanguageSwitcherStyleSettings;
	}
}

export const languageSwitcherStyleSettings = new PluginStyleSettings({
	defaultValues: {
		languageSwitcher: {
			toggleButtonBackground: "transparent",
			toggleButtonBackgroundHover: ({ theme }) =>
				theme.type === "dark" ? "#27272a" : "#f6f6f7",
			toggleButtonForeground: ({ theme }) =>
				theme.colors["tab.activeForeground"],
			toggleButtonOpacityActive: "1",
			toggleButtonOpacityInactive: "0.4",
			toggleButtonBorder: "1px solid transparent",
			toggleButtonBorderRadius: "0.2rem",
		},
	},
});

export function getLanguageSwitcherBaseStyles(
	{ cssVar }: ResolverContext,
	options: EcPluginLanguageSwitcherOptions,
) {
	const baseStyles = `
		html[data-preferred-language="ts"] .sb-language-group {
			figure:last-of-type {
				display: none;
			}

			pre + pre {
				display: none;
			}
		}

		html[data-preferred-language="js"] .sb-language-group {
			figure:first-of-type {
				display: none;
			}

			pre:has(+ pre) {
				display: none;
			}
		}
	`.trim();

	const toggleButtonStyles = `
		.sb-ts-js-toggle,
		/* Expressive code hides all non-svg elements inside the header, so we need this selector to override it. */
			.expressive-code
			html .sb-ts-js-toggle {
			appearance: none;
			min-height: 2rem;
			display: flex;
			align-items: center;
			gap: 0.5rem;
			background: ${cssVar("languageSwitcher.toggleButtonBackground")};
			color: ${cssVar("languageSwitcher.toggleButtonForeground")};
			padding: 0 0.6rem;
			margin-left: auto;
			border-radius: ${cssVar("languageSwitcher.toggleButtonBorderRadius")};
			border: ${cssVar("languageSwitcher.toggleButtonBorder")};
			font-family: var(--sb-font-mono);
			font-size: 0.9rem;

			&:hover {
				background: ${cssVar("languageSwitcher.toggleButtonBackgroundHover")};
			}

			&::before,
			&::after {
				min-width: 1.5rem;
				display: flex;
				justify-content: center;
				align-items: center;
				color: inherit;
			}

			&::before {
				content: "${options.toggleButtonJsLabel}";
				opacity: ${cssVar("languageSwitcher.toggleButtonOpacityActive")};
			}

			&::after {
				content: "${options.toggleButtonTsLabel}";
				opacity: ${cssVar("languageSwitcher.toggleButtonOpacityInactive")};
			}

			&:checked {
				&::before {
					opacity: ${cssVar("languageSwitcher.toggleButtonOpacityInactive")};
				}

				&::after {
					opacity: ${cssVar("languageSwitcher.toggleButtonOpacityActive")};
				}
			}
		}
	`.trim();

	const styles = [
		baseStyles,
		options.showToggleButton ? toggleButtonStyles : "",
	];

	return styles.join("\n");
}
