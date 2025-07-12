/**
 *
 * Roket :: Middleware
 *
 * @file Provides utility functions and types for dealing with middlewares for functions
 * @module Roket
 * @author kvbc
 * @version 1.0.0
 * @description
 *
 * Overview of different possible use cases
 *
 * | Args & Middlewares & Self  | Args & Middlewares | Args & Self    | Middlewares    | Self           |
 * | -------------------------- | ------------------ | -------------- | -------------- | -------------- |
 * | -                          | Call               | CallSelf       | Wrap           | WrapSelf       |
 * | CallMethod                 | -                  | CallMethodSelf | WrapMethod     | WrapMethodSelf |
 *
 */

type EmptyObject = Record<string, unknown>;
type Args = Record<string, unknown>;
type MethodArgs<TSelf> = Args & { self: TSelf };

type Function = (args: Args) => unknown;
type Method<TSelf> = (args: MethodArgs<TSelf>) => unknown;

type MiddlewaresOf<TMiddleware> = TMiddleware | TMiddleware[];

type BaseMiddleware<TArgs extends Args, TRet = EmptyObject> = (args: TArgs) => TRet | void;
type BaseMiddlewares<TArgs extends Args, TRet = EmptyObject> = MiddlewaresOf<BaseMiddleware<TArgs, TRet>>;

type Middleware<TFunc extends Function> = BaseMiddleware<Parameters<TFunc>[0], ReturnType<TFunc>>;
type Middlewares<TFunc extends Function> = MiddlewaresOf<Middleware<TFunc>>;

type MethodMiddleware<TSelf, TMethod extends Method<TSelf>> = BaseMiddleware<
	Parameters<TMethod>[0],
	ReturnType<TMethod>
>;
type MethodMiddlewares<TSelf, TMethod extends Method<TSelf>> = MiddlewaresOf<MethodMiddleware<TSelf, TMethod>>;

type KeyedMiddlewares<TSelf> = Partial<Record<keyof TSelf, Middlewares<Function>>>;
type KeyedMethodMiddlewares<TSelf> = Partial<Record<keyof TSelf, MethodMiddlewares<TSelf, Method<TSelf>>>>;
type SelfKeyedMiddlewares<
	TSelf = Record<string, unknown>,
	TKeyedMiddlewares extends KeyedMiddlewares<TSelf> = KeyedMiddlewares<TSelf>,
> = {
	middlewares: TKeyedMiddlewares;
};
type SelfKeyedMethodMiddlewares<
	TSelf = Record<string, unknown>,
	TKeyedMethodMiddlewares extends KeyedMethodMiddlewares<TSelf> = KeyedMethodMiddlewares<TSelf>,
> = {
	methodMiddlewares: TKeyedMethodMiddlewares;
};

export { Middleware as Fn, Middlewares as Fns, MethodMiddleware as FnSelf, MethodMiddlewares as FnsSelf };

/*
 * Call given function with given args and middlewares.
 * Internal: meant to only be used in this file as there is
 *           a public alias `Call` that takes in generic <Function>
 *           which is much cleaner in my opinion
 */
function callBase<TArgs extends Args, TRet = void>(
	args: TArgs,
	middlewares: BaseMiddlewares<TArgs, TRet>,
	func: (args: TArgs) => TRet,
): TRet {
	if (typeIs(middlewares, "function")) {
		middlewares = [middlewares];
	}
	for (const middleware of middlewares) {
		const ret = middleware(args);
		if (ret !== undefined) {
			return ret;
		}
	}
	return func(args);
}

function getSelfMiddlewares<
	TSelf extends SelfKeyedMiddlewares<unknown, TKeyedMiddlewares>,
	TKeyedMiddlewares extends KeyedMiddlewares<TSelf>,
	TFunc extends Function,
>(selfObj: TSelf, key: keyof TKeyedMiddlewares): Middlewares<TFunc> {
	return selfObj.middlewares[key] ?? [];
}

function getSelfMethodMiddlewares<
	TSelf extends SelfKeyedMethodMiddlewares<unknown, TKeyedMethodMiddlewares>,
	TKeyedMethodMiddlewares extends KeyedMethodMiddlewares<TSelf>,
	TMethod extends Method<TSelf>,
>(selfObj: TSelf, key: keyof TKeyedMethodMiddlewares): MethodMiddlewares<TSelf, TMethod> {
	return selfObj.methodMiddlewares[key] ?? [];
}

export function Load() {}

export function LoadMethods() {}

/*
 *  ______                _   _
 * |  ____|              | | (_)
 * | |__ _   _ _ __   ___| |_ _  ___  _ __
 * |  __| | | | '_ \ / __| __| |/ _ \| '_ \
 * | |  | |_| | | | | (__| |_| | (_) | | | |
 * |_|   \__,_|_| |_|\___|\__|_|\___/|_| |_|
 *
 */

/*
 * Call given function with given args and middlewares.
 * (Clean version with <Function> generics)
 */
export function Call<TFunc extends Function>(
	args: Parameters<TFunc>[0],
	middlewares: Middlewares<TFunc>,
	func: (_args: typeof args) => ReturnType<TFunc>,
): ReturnType<TFunc> {
	return callBase(args, middlewares, func);
}

/*
 * Call given function with given args
 * and middlewares from self
 */
export function CallSelf<
	TSelf extends SelfKeyedMiddlewares<unknown, TKeyedMiddlewares>,
	TKeyedMiddlewares extends KeyedMiddlewares<TSelf>,
	TFunc extends Function,
>(
	selfObj: TSelf,
	args: Parameters<TFunc>[0],
	key: keyof TKeyedMiddlewares,
	func: (_args: typeof args) => ReturnType<TFunc>,
): ReturnType<TFunc> {
	const middlewares = getSelfMiddlewares(selfObj, key);
	return Call(args, middlewares, func);
}

/*
 * Wrap given function with given middlewares
 */
export function Wrap<TFunc extends Function>(
	middlewares: Middlewares<TFunc>,
	func: (_args: Parameters<TFunc>[0]) => ReturnType<TFunc>,
): typeof func {
	return (args) => {
		return Call(args, middlewares, func);
	};
}

/*
 * Wrap given function with given args
 * and middlewares from self
 */
export function WrapSelf<
	TSelf extends SelfKeyedMiddlewares<unknown, TKeyedMiddlewares>,
	TKeyedMiddlewares extends KeyedMiddlewares<TSelf>,
	TFunc extends Function,
>(selfObj: TSelf, key: keyof TKeyedMiddlewares, func: (args: Parameters<TFunc>[0]) => ReturnType<TFunc>): typeof func {
	return (args) => {
		return CallSelf(selfObj, args, key, func);
	};
}

/*
 *   __  __      _   _               _
 *  |  \/  |    | | | |             | |
 *  | \  / | ___| |_| |__   ___   __| |
 *  | |\/| |/ _ \ __| '_ \ / _ \ / _` |
 *  | |  | |  __/ |_| | | | (_) | (_| |
 *  |_|  |_|\___|\__|_| |_|\___/ \__,_|
 *
 */

/*
 * Call given method with given self, args, and middlewares
 */
export function CallMethod<TSelf, TMethod extends Method<TSelf>>(
	selfObj: TSelf,
	args: Omit<Parameters<TMethod>[0], "self">,
	middlewares: MethodMiddlewares<TSelf, TMethod>,
	method: (selfObj: TSelf, _args: Parameters<TMethod>[0]) => ReturnType<TMethod>,
): ReturnType<TMethod> {
	return callBase({ args, self: selfObj }, middlewares, (args) => {
		return method(selfObj, args);
	});
}

/*
 * Wrap given method with given middlewares.
 */
export function WrapMethod<TSelf, TMethod extends Method<TSelf>>(
	middlewares: MethodMiddlewares<TSelf, TMethod>,
	method: (selfObj: TSelf, _args: Parameters<TMethod>[0]) => ReturnType<TMethod>,
): typeof method {
	return (selfObj, args) => {
		return CallMethod(selfObj, args, middlewares, method);
	};
}

// TODO

export function CallMethodSelf() {}

export function WrapMethodSelf() {}
