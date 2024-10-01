import { Button } from "@kobalte/core/button";
import { writeClipboard } from "@solid-primitives/clipboard";
import { type ComponentProps, Show, createSignal, splitProps } from "solid-js";
import { CheckIcon, CopyIcon } from "./icons";

export function h1(props: ComponentProps<"h1">) {
	return <h1 {...props} style={{ color: "green" }} />;
}

export function h2(props: ComponentProps<"h2">) {
	return <h2 {...props} style={{ color: "green" }} />;
}

export function h3(props: ComponentProps<"h3">) {
	return <h3 {...props} style={{ color: "green" }} />;
}

export function h4(props: ComponentProps<"h4">) {
	return <h4 {...props} style={{ color: "green" }} />;
}

export function h5(props: ComponentProps<"h5">) {
	return <h4 {...props} style={{ color: "green" }} />;
}

export function h6(props: ComponentProps<"h6">) {
	return <h4 {...props} style={{ color: "green" }} />;
}

export function a(props: ComponentProps<"a">) {
	const outbound = () => (props.href ?? "").includes("://");

	return (
		<a
			target={outbound() ? "_blank" : undefined}
			rel={outbound() ? "noopener noreferrer" : undefined}
			{...props}
		/>
	);
}

export function code(props: ComponentProps<"code">) {
	return <code class={""} {...props} />;
}

export function pre(props: ComponentProps<"pre">) {
	let domRef: HTMLPreElement | undefined;

	const [local, others] = splitProps(props, ["children"]);

	const [isCopied, setIsCopied] = createSignal(false);

	const reset = () => {
		setTimeout(() => setIsCopied(false), 200);
	};

	const copyToClipboard = () => {
		setIsCopied(true);
		void writeClipboard(domRef?.querySelector("code")?.innerText.trim() ?? "");
		setTimeout(() => setIsCopied(false), 2000);
	};

	return (
		<pre ref={domRef} onMouseLeave={reset} {...others}>
			<Button
				aria-label={isCopied() ? "Copied!" : "Copy to clipboard"}
				onClick={copyToClipboard}
				class={""}
			>
				<Show when={isCopied()} fallback={<CopyIcon class="" />}>
					<CheckIcon class="" />
				</Show>
			</Button>
			{local.children}
		</pre>
	);
}

export function table(props: ComponentProps<"table">) {
	const [local, others] = splitProps(props, ["class"]);

	return (
		<div style={{ "overflow-x": "auto" }}>
			<table class="" {...others} />
		</div>
	);
}
