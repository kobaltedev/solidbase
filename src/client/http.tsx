import { httpStatus } from "@solidjs/web";

/** Sets the response status for the current server render (no-op on the client). Usable from MDX. */
export function HttpStatusCode(props: { code: number; text?: string }) {
	httpStatus(props.code, props.text);
	return null;
}
