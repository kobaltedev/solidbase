import type { ComponentProps } from "@solidjs/web";
import { useResolvedHref } from "../../client/base-path.js";
import styles from "./Link.module.css";

export default function Link(props: ComponentProps<"a">) {
	const outbound = () => String(props.href ?? "").includes("://");
	const href = useResolvedHref(() => props.href);

	return (
		<a
			class={styles.link}
			target={outbound() ? "_blank" : undefined}
			rel={outbound() ? "noopener noreferrer" : undefined}
			{...props}
			href={href()}
		/>
	);
}
