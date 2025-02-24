import { DynamicImage, OpenGraph } from "@solid-mediakit/og";
import interMedium from "./Inter_28pt-Medium.ttf?arraybuffer";
import interBold from "./Inter_28pt-Bold.ttf?arraybuffer";
import lexendBold from "./Lexend-Bold.ttf?arraybuffer";

declare module "solid-js" {
	namespace JSX {
		interface HTMLAttributes<T> {
			tw?: string;
		}
	}
}

const origin = import.meta.env.VITE_ORIGIN ?? "http://localhost:4000";
const fonts = [
	{
		name: "Inter",
		weight: 500,
		data: interMedium
	},
	{
		name: "Inter",
		weight: 700,
		data: interBold
	},
	{
		name: "Lexend",
		weigth: 700,
		data: lexendBold
	}
]

export function OGImage() {
	return (
		<OpenGraph
			origin={origin}
		>
			<DynamicImage imageOptions={{ fonts }}>
				<div tw="flex flex-row bg-neutral-900 w-full h-full justify-center items-center text-white p-16">
					<div tw="flex flex-col flex-1">
						<div
							tw="text-7xl font-bold text-transparent mb-4"
							style={{
								"font-family": "Lexend",
								"background-image": "linear-gradient(-20deg, hsl(200, 98%, 39%) 30%, hsl(199, 95%, 74%))",
								"background-clip": "text"
							}}
						>
							SolidBase
						</div>
						<div tw="text-5xl text-neutral-300 font-black mb-4" style={{ "font-family": "Inter" }}>
							Static Site Generation for SolidStart
						</div>
						<div tw="text-3xl text-neutral-400" style={{ "font-family": "Inter" }}>
							Fully Featured, Fully Customisable
						</div>
					</div>

					<img
						alt="n/a"
						src="https://raw.githubusercontent.com/kobaltedev/solidbase/refs/heads/main/.github/solidbase.png"
						width="450"
					/>
				</div>
			</DynamicImage>
		</OpenGraph>
	);
}
