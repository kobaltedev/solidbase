import { Button } from "@kobalte/core/button";
import { writeClipboard } from "@solid-primitives/clipboard";
import {
	type ComponentProps,
	Switch,
	createSignal,
	splitProps,
	createContext,
	Match,
	Setter,
	Accessor,
	useContext,
    JSX,
    For
} from "solid-js";
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

export function a(props: ComponentProps<"a"> & { "data-auto-heading"?: "" }) {
	const outbound = () => (props.href ?? "").includes("://");
	const autoHeading = () => props["data-auto-heading"] === "";

	return (
		<a
			target={outbound() ? "_blank" : undefined}
			rel={outbound() ? "noopener noreferrer" : undefined}
			style={{
				color: autoHeading() ? "inherit" : undefined,
			}}
			{...props}
		/>
	);
}

export function code(props: ComponentProps<"code">) {
	return <code class={""} {...props} />;
}

export function table(props: ComponentProps<"table">) {
	const [local, others] = splitProps(props, ["class"]);

	return (
		<div style={{ "overflow-x": "auto" }}>
			<table class="" {...others} />
		</div>
	);
}

type AlertTypes = 'TIP'| 'NOTE'| 'IMPORTANT'| 'WARNING'| 'CAUTION';
interface QuoteContextValue {
	type: Accessor<AlertTypes | undefined>;
	setType: Setter<AlertTypes | undefined>;
}
const QuoteContext = createContext<QuoteContextValue>();

export function blockquote(props: ComponentProps<"blockquote">) {
	const [type, setType] = createSignal<AlertTypes>();

	return <QuoteContext.Provider value={{type, setType}}> why template2 is not a function?
		<Switch fallback={<blockquote {...props} style={{ background: "aquamarine" }} />}>
			<Match when={type() === "TIP"}>
				<blockquote {...props} style={{ background: "blue" }}/>
			</Match>
			<Match when={type() === "NOTE"}>
				<blockquote {...props} style={{ background: "gray" }}/>
			</Match>
			<Match when={type() === "IMPORTANT"}>
				<blockquote {...props} style={{ background: "purple" }}/>
			</Match>
			<Match when={type() === "WARNING"}>
				<blockquote {...props} style={{ background: "orange" }}/>
			</Match>
			<Match when={type() === "CAUTION"}>
				<blockquote {...props} style={{ background: "red" }}/>
			</Match>
		</Switch>
	</QuoteContext.Provider>;
}

export function p(props: ComponentProps<"p">) {
	const quoteContext = useContext(QuoteContext);
	if (quoteContext !== undefined && typeof props.children === "string") {
		for (const marker of ["[!TIP]", "[!NOTE]", "[!IMPORTANT]", "[!WARNING]", "[!CAUTION]"]) {
			if (!(props.children as string).includes(marker)) continue;

			quoteContext.setType(marker.slice(2, -1) as AlertTypes);

			return <p {...props} style={{color: "white"}}>
				{props.children.replace(marker + "\n", "")}
			</p>;
		}
	}

	return <p {...props} style={{color: "green"}}/>;
}

export function li(props: ComponentProps<"li">) {
	return <li {...props} style={{ color: "green" }} />;
}

export function ul(props: ComponentProps<"ul">) {
	return <ul {...props} style={{ background: "lime" }} />;
}

export function ol(props: ComponentProps<"ol"> & { "data-toc"?: "" }) {
	if (props["data-toc"] === "")
		return <ol {...props} style={{ background: "darkseagreen" }} />;

	return <ol {...props} style={{ background: "aquamarine" }} />;
}
