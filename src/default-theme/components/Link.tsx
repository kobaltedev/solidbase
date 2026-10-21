import type { ComponentProps } from "@solidjs/web";
import {
	fragmentAriaCurrent,
	useResolvedHref,
} from "../../client/base-path.js";
import styles from "./Link.module.css";

export default function Link(props: ComponentProps<"a">) {
	const outbound = () => String(props.href ?? "").includes("://");
	const href = useResolvedHref(() => props.href);

	return (
		<a
			class={styles.link}
			target={outbound() ? "_blank" : undefined}
			rel={outbound() ? "noopener noreferrer" : undefined}
			aria-current={fragmentAriaCurrent(props.href)}
			{...props}
			href={href()}
		/>
	);
}
