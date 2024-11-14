import { For, Show } from "solid-js";

import styles from "./Footer.module.css";

import type { SocialLink } from "..";
import { useRouteConfig } from "../utils";

const logos: Partial<Record<SocialLink["type"], string>> = {
	discord:
		"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjcuMTQgOTYuMzYiPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTEwNy43LDguMDdBMTA1LjE1LDEwNS4xNSwwLDAsMCw4MS40NywwYTcyLjA2LDcyLjA2LDAsMCwwLTMuMzYsNi44M0E5Ny42OCw5Ny42OCwwLDAsMCw0OSw2LjgzLDcyLjM3LDcyLjM3LDAsMCwwLDQ1LjY0LDAsMTA1Ljg5LDEwNS44OSwwLDAsMCwxOS4zOSw4LjA5QzIuNzksMzIuNjUtMS43MSw1Ni42LjU0LDgwLjIxaDBBMTA1LjczLDEwNS43MywwLDAsMCwzMi43MSw5Ni4zNiw3Ny43LDc3LjcsMCwwLDAsMzkuNiw4NS4yNWE2OC40Miw2OC40MiwwLDAsMS0xMC44NS01LjE4Yy45MS0uNjYsMS44LTEuMzQsMi42Ni0yYTc1LjU3LDc1LjU3LDAsMCwwLDY0LjMyLDBjLjg3LjcxLDEuNzYsMS4zOSwyLjY2LDJhNjguNjgsNjguNjgsMCwwLDEtMTAuODcsNS4xOSw3Nyw3NywwLDAsMCw2Ljg5LDExLjFBMTA1LjI1LDEwNS4yNSwwLDAsMCwxMjYuNiw4MC4yMmgwQzEyOS4yNCw1Mi44NCwxMjIuMDksMjkuMTEsMTA3LjcsOC4wN1pNNDIuNDUsNjUuNjlDMzYuMTgsNjUuNjksMzEsNjAsMzEsNTNzNS0xMi43NCwxMS40My0xMi43NFM1NCw0Niw1My44OSw1Myw0OC44NCw2NS42OSw0Mi40NSw2NS42OVptNDIuMjQsMEM3OC40MSw2NS42OSw3My4yNSw2MCw3My4yNSw1M3M1LTEyLjc0LDExLjQ0LTEyLjc0Uzk2LjIzLDQ2LDk2LjEyLDUzLDkxLjA4LDY1LjY5LDg0LjY5LDY1LjY5WiIvPjwvc3ZnPg==",
	github:
		"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTgiIGhlaWdodD0iOTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00OC44NTQgMEMyMS44MzkgMCAwIDIyIDAgNDkuMjE3YzAgMjEuNzU2IDEzLjk5MyA0MC4xNzIgMzMuNDA1IDQ2LjY5IDIuNDI3LjQ5IDMuMzE2LTEuMDU5IDMuMzE2LTIuMzYyIDAtMS4xNDEtLjA4LTUuMDUyLS4wOC05LjEyNy0xMy41OSAyLjkzNC0xNi40Mi01Ljg2Ny0xNi40Mi01Ljg2Ny0yLjE4NC01LjcwNC01LjQyLTcuMTctNS40Mi03LjE3LTQuNDQ4LTMuMDE1LjMyNC0zLjAxNS4zMjQtMy4wMTUgNC45MzQuMzI2IDcuNTIzIDUuMDUyIDcuNTIzIDUuMDUyIDQuMzY3IDcuNDk2IDExLjQwNCA1LjM3OCAxNC4yMzUgNC4wNzQuNDA0LTMuMTc4IDEuNjk5LTUuMzc4IDMuMDc0LTYuNi0xMC44MzktMS4xNDEtMjIuMjQzLTUuMzc4LTIyLjI0My0yNC4yODMgMC01LjM3OCAxLjk0LTkuNzc4IDUuMDE0LTEzLjItLjQ4NS0xLjIyMi0yLjE4NC02LjI3NS40ODYtMTMuMDM4IDAgMCA0LjEyNS0xLjMwNCAxMy40MjYgNS4wNTJhNDYuOTcgNDYuOTcgMCAwIDEgMTIuMjE0LTEuNjNjNC4xMjUgMCA4LjMzLjU3MSAxMi4yMTMgMS42MyA5LjMwMi02LjM1NiAxMy40MjctNS4wNTIgMTMuNDI3LTUuMDUyIDIuNjcgNi43NjMuOTcgMTEuODE2LjQ4NSAxMy4wMzggMy4xNTUgMy40MjIgNS4wMTUgNy44MjIgNS4wMTUgMTMuMiAwIDE4LjkwNS0xMS40MDQgMjMuMDYtMjIuMzI0IDI0LjI4MyAxLjc4IDEuNTQ4IDMuMzE2IDQuNDgxIDMuMzE2IDkuMTI2IDAgNi42LS4wOCAxMS44OTctLjA4IDEzLjUyNiAwIDEuMzA0Ljg5IDIuODUzIDMuMzE2IDIuMzY0IDE5LjQxMi02LjUyIDMzLjQwNS0yNC45MzUgMzMuNDA1LTQ2LjY5MUM5Ny43MDcgMjIgNzUuNzg4IDAgNDguODU0IDB6IiBmaWxsPSJjdXJyZW50Q29sb3IiLz48L3N2Zz4=",
	opencollective:
		"data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNjAgNjAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8ZyBpZD0iUGFnZS0xIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0ib3BlbmNvbGxlY3RpdmUtbG9nbyI+CiAgICAgICAgICAgIDxnIGlkPSJpY29uIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjAwMDAwMCwgMTAuMDAwMDAwKSI+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMzQuNjE5NDI0NSw4LjE3ODgwMDExIEMzNi43NTA4NDg5LDExLjI0OTUyNjYgMzgsMTQuOTc4ODg1OSAzOCwxOSBDMzgsMjMuMDIxMTE0MSAzNi43NTA4NDg5LDI2Ljc1MDQ3MzQgMzQuNjE5NDI0NSwyOS44MjExOTk5IEwyOS42OTc2Nzc5LDI0Ljg5OTQ1MzMgQzMwLjY2NDE3NDIsMjMuMTUwNjA1MyAzMS4yMTQyODU3LDIxLjEzOTU0NTQgMzEuMjE0Mjg1NywxOSBDMzEuMjE0Mjg1NywxNi44NjA0NTQ2IDMwLjY2NDE3NDIsMTQuODQ5Mzk0NyAyOS42OTc2Nzc5LDEzLjEwMDU0NjcgTDM0LjYxOTQyNDUsOC4xNzg4MDAxMSBaIE0yOS44MjExOTk5LDMuMzgwNTc1NTIgTDI0Ljg5OTQ1MzMsOC4zMDIzMjIxNSBDMjMuMTUwNjA1Myw3LjMzNTgyNTc4IDIxLjEzOTU0NTQsNi43ODU3MTQyOSAxOSw2Ljc4NTcxNDI5IEMxMi4yNTQyMzYzLDYuNzg1NzE0MjkgNi43ODU3MTQyOSwxMi4yNTQyMzYzIDYuNzg1NzE0MjksMTkgQzYuNzg1NzE0MjksMjUuNzQ1NzYzNyAxMi4yNTQyMzYzLDMxLjIxNDI4NTcgMTksMzEuMjE0Mjg1NyBDMjEuMTM5NTQ1NCwzMS4yMTQyODU3IDIzLjE1MDYwNTMsMzAuNjY0MTc0MiAyNC44OTk0NTMzLDI5LjY5NzY3NzkgTDI5LjgyMTE5OTksMzQuNjE5NDI0NSBDMjYuNzUwNDczNCwzNi43NTA4NDg5IDIzLjAyMTExNDEsMzggMTksMzggQzguNTA2NTg5NzUsMzggMCwyOS40OTM0MTAyIDAsMTkgQzAsOC41MDY1ODk3NSA4LjUwNjU4OTc1LDAgMTksMCBDMjMuMDIxMTE0MSwwIDI2Ljc1MDQ3MzQsMS4yNDkxNTExMiAyOS44MjExOTk5LDMuMzgwNTc1NTIgWiIgaWQ9IkNvbWJpbmVkLVNoYXBlLUNvcHktMiIgZmlsbD0iY3VycmVudENvbG9yIj48L3BhdGg+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMzQuNjE5NDI0NSw4LjE3ODgwMDExIEMzNi43NTA4NDg5LDExLjI0OTUyNjYgMzgsMTQuOTc4ODg1OSAzOCwxOSBDMzgsMjMuMDIxMTE0MSAzNi43NTA4NDg5LDI2Ljc1MDQ3MzQgMzQuNjE5NDI0NSwyOS44MjExOTk5IEwyOS42OTc2Nzc5LDI0Ljg5OTQ1MzMgQzMwLjY2NDE3NDIsMjMuMTUwNjA1MyAzMS4yMTQyODU3LDIxLjEzOTU0NTQgMzEuMjE0Mjg1NywxOSBDMzEuMjE0Mjg1NywxNi44NjA0NTQ2IDMwLjY2NDE3NDIsMTQuODQ5Mzk0NyAyOS42OTc2Nzc5LDEzLjEwMDU0NjcgTDM0LjYxOTQyNDUsOC4xNzg4MDAxMSBaIiBpZD0iY2xvc2luZy1vIiBmaWxsPSJjdXJyZW50Q29sb3IiPjwvcGF0aD4KICAgICAgICAgICAgPC9nPgogICAgICAgICAgICAKICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==",
};

export default function Footer() {
	const config = useRouteConfig();

	return (
		<footer class={styles.footer}>
			<div>
				<Show when={config().logo} fallback={<span>{config().title}</span>}>
					<img src={config().logo} alt={config().title} />
				</Show>
				{config().description}
			</div>

			<Show when={config().themeConfig?.socialLinks}>
				{(links) => (
					<div>
						<span>Community</span>
						<div class={styles.socials}>
							<For each={Object.keys(links())}>
								{(social) => {
									const preset = Object.hasOwn(logos, social);

									const data = (): SocialLink | undefined => {
										const link = (links() as any)[social];
										if (!link) return;

										const data = preset
											? { type: social as SocialLink["type"], link }
											: link;

										if (!preset) data.type = "custom";

										return data;
									};

									return (
										<Show when={data()}>
											{(data) => <SocialLinkView {...data()} />}
										</Show>
									);
								}}
							</For>
						</div>
					</div>
				)}
			</Show>
		</footer>
	);
}

function SocialLinkView(props: SocialLink) {
	return (
		<a href={props.link} target="_blank" rel="noreferrer noopener">
			<Show
				when={props.type !== "custom"}
				fallback={<img alt={props.label} src={props.logo} />}
			>
				<img alt={props.type} src={logos[props.type as keyof typeof logos]} />
			</Show>
		</a>
	);
}
