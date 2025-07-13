export type EmptyObject = Record<string, never>;

export type FunctionKeysNames<T extends Record<string, unknown>> = {
	[K in keyof T as T[K] extends (...args: unknown[]) => unknown ? K : never]: K;
};
