/**
 *
 * Roket :: Middleware
 *
 * @file Provides utility functions and types for dealing with middlewares for functions
 * @module Roket
 * @author kvbc
 * @version 1.0.0
 *
 */

import { Middleware, RFn, Types } from ".";

// export type Methods<T> = {
// 	[K in keyof T as T[K] extends (...args: any[]) => any ? K : never]: T[K]; // eslint-disable-line
// };

type Middleware<TArgs = unknown, TRet = unknown, TThis = unknown> = RFn.Fn<TArgs, TRet | void, TThis>;
type Middlewares<TArgs = unknown, TRet = unknown, TThis = unknown> = Partial<{
	before: Middleware<TArgs, TRet, TThis>[];
	after: Middleware<TArgs, TRet, TThis>[];
}>;
type KeyedMiddlewares<TSelf = undefined> = TSelf extends undefined
	? Partial<Record<string, Middlewares>>
	: Partial<{
			[K in keyof TSelf]: Middlewares<Parameters<TSelf[K]>[1], ReturnType<TSelf[K]>, Parameters<TSelf[K]>[0]>;
		}>;
type Self = { middlewares?: KeyedMiddlewares };

export { Middleware as Fn, Middlewares as Fns, KeyedMiddlewares as Middlewares };

export function call<TArgs, TRet, TThis>(
	args: TArgs,
	middlewares: Middlewares<TArgs, TRet, TThis>,
	fn: RFn.Fn<TArgs, TRet, TThis>,
	fnThis: TThis,
): TRet {
	for (const middleware of middlewares.before ?? []) {
		const ret = middleware(args, fnThis);
		if (ret !== undefined) {
			return ret;
		}
	}

	const funcRet = fn(args, fnThis);

	for (const middleware of middlewares.after ?? []) {
		const ret = middleware(args, fnThis);
		if (ret !== undefined) {
			return ret;
		}
	}

	return funcRet;
}

/*
 * Call given function with given args, and middlewares
 */
export function Call<TArgs, TRet>(
	args: TArgs,
	middlewares: Middlewares<TArgs, TRet, undefined>,
	fn: RFn.Fn<TArgs, TRet, undefined>,
): TRet {
	return call<TArgs, TRet, undefined>(args, middlewares, fn, undefined);
}

export function Wrap<TArgs, TRet>(
	middlewares: Middlewares<TArgs, TRet, undefined>,
	func: RFn.Fn<TArgs, TRet, undefined>,
): (args: TArgs) => TRet {
	return (args) => {
		return Call<TArgs, TRet>(args, middlewares, func);
	};
}

/*
 * Wrap given function with given middlewares.
 */
export function WrapKey<TSelf extends Self, TArgs = Types.EmptyObject, TRet = void>(
	key: keyof TSelf,
	func: RFn.Fn<TArgs, TRet, TSelf>,
): (thisArg: TSelf, args: TArgs) => TRet {
	return (thisArg, args) => {
		const nokeyMiddlewares: Middlewares<TArgs, TRet, TSelf> = {
			before: [],
			after: [],
		};
		const middlewares: Middlewares<TArgs, TRet, TSelf> =
			key === undefined ? nokeyMiddlewares : (thisArg?.middlewares?.[key] ?? nokeyMiddlewares);
		return call<TArgs, TRet, TSelf>(args, middlewares, func, thisArg);
	};
}
