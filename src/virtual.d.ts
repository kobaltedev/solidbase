interface SocialLink {
	type: "discord" | "github" | "opencollective" | "custom";
	link: string;
	logo?: string;
	label?: string;
}

declare module "virtual:solidbase" {
	export const solidBaseConfig: {
		title: string;
		description: string;
		logo?: string;
		titleTemplate?: string;
		lastUpdated: Intl.DateTimeFormatOptions | false;
		footer: boolean;
		socialLinks?:
			| Record<Exclude<SocialLink["type"], "custom">, string>
			| Record<string, Omit<SocialLink, "type">>;
	};
}
