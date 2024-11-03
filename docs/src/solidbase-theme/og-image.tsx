import { DynamicImage, OpenGraph } from "@solid-mediakit/og";

declare module "solid-js" {
	namespace JSX {
		interface HTMLAttributes<T> {
			tw?: string;
		}
	}
}

export function OGImage() {
	return (
		<OpenGraph
			origin={import.meta.env.VITE_ORIGIN ?? "https://solidbase.netlify.app"}
		>
			<DynamicImage>
				<div tw="flex flex-row bg-neutral-900 w-full h-full justify-center items-center text-white p-18">
					<div tw="flex flex-col flex-1">
						<p tw="text-7xl mb-8">
							Solid
							<span tw="text-blue-500">Base</span>
						</p>
						<p tw="text-3xl text-neutral-300">
							Fully featured, fully customisable static site generation for
							SolidStart
						</p>
					</div>

					<img
						tw="ml-8"
						src="https://raw.githubusercontent.com/kobaltedev/solidbase/refs/heads/main/.github/solidbase.png"
						width="450"
					/>
				</div>
			</DynamicImage>
		</OpenGraph>
	);
}
