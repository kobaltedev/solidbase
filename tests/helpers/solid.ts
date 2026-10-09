/**
 * Solid 2 components return lazy JSX (a thunk evaluated by the renderer). Tests that call a
 * component/provider directly must evaluate that thunk for its children to run.
 */
export function mount<T>(jsx: T): unknown {
	let value: unknown = jsx;
	while (typeof value === "function") value = (value as () => unknown)();
	if (Array.isArray(value)) return value.map(mount);
	return value;
}
