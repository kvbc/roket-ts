type EmptyObject = Record<string, never>;

type Args = Record<string, unknown>;
type MethodArgs<TSelf, TArgs extends Args> = TArgs & { self: TSelf };

type MiddlewaresOf<TMiddleware> = TMiddleware | TMiddleware[];

type Middleware<TArgs extends Args, TRet = EmptyObject> = (args: TArgs) => TRet | void;
type Middlewares<TArgs extends Args, TRet = EmptyObject> = MiddlewaresOf<Middleware<TArgs, TRet>>;

type MethodMiddleware<TSelf, TArgs extends Args, TRet = EmptyObject> = Middleware<MethodArgs<TSelf, TArgs>, TRet>;
type MethodMiddlewares<TSelf, TArgs extends Args, TRet = EmptyObject> = MiddlewaresOf<
	MethodMiddleware<TSelf, TArgs, TRet>
>;

export { Middleware as Fn, Middlewares as Fns, MethodMiddleware as FnSelf, MethodMiddlewares as FnsSelf };

export function Call<TArgs extends Args, TRet = void>(
	args: TArgs,
	middlewares: Middlewares<TArgs, TRet>,
	handler: (args: TArgs) => TRet,
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
	return handler(args);
}

export function CallMethod<TSelf, TArgs extends Args, TRet = void>(
	selfObj: TSelf,
	args: TArgs,
	middlewares: Middlewares<MethodArgs<TSelf, TArgs>, TRet>,
	handler: (args: MethodArgs<TSelf, TArgs>) => TRet,
): TRet {
	return Call<MethodArgs<TSelf, TArgs>, TRet>({ ...args, self: selfObj }, middlewares, handler);
}

export function Wrap<TArgs extends Args, TRet = void>(
	middlewares: Middlewares<TArgs, TRet>,
	handler: (args: TArgs) => TRet,
): (args: TArgs) => TRet {
	return (args) => {
		return Call<TArgs, TRet>(args, middlewares, handler);
	};
}

export function WrapMethod<TSelf, TArgs extends Args, TRet = void>(): (selfObj: TSelf, args: TArgs) => TRet {
	return (selfObj, args) => {
		return CallMethod<TSelf, TArgs, TRet>();
	};
}
