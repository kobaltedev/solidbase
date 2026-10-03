import type { ComponentProps } from "@solidjs/web";
import styles from "./Link.module.css";

export default function Link(props: ComponentProps<"a">) {
	const outbound = () => String(props.href ?? "").includes("://");

	return (
		<a
			class={styles.link}
			target={outbound() ? "_blank" : undefined}
			rel={outbound() ? "noopener noreferrer" : undefined}
			{...props}
		/>
	);
}
