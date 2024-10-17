import {
	SolidBaseServerScript,
	getLang,
	getTheme,
} from "@kobalte/solidbase/client";
// @refresh reload
import { StartServer, createHandler } from "@solidjs/start/server";

export default createHandler(() => (
	<StartServer
		document={({ assets, children, scripts }) => (
			<html lang={getLang()?.code} data-theme={getTheme()}>
				<head>
					<meta charset="utf-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<link rel="icon" href="/favicon.ico" />
					<SolidBaseServerScript />
					{assets}
				</head>
				<body>
					<div id="app">{children}</div>
					{scripts}
				</body>
			</html>
		)}
	/>
));
