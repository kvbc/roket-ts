---
id: middleware
title: Middleware Utilities
sidebar_position: 1
---

# Roket :: Middleware

> Utility functions and types for dealing with middlewares for functions and methods.

### Author

**@kvbc**

---

## Overview Table

| Args & Middlewares & Self | Args & Middlewares | Args & Self      | Middlewares  | Self             |
| ------------------------- | ------------------ | ---------------- | ------------ | ---------------- |
| -                         | `Call`             | -                | `Wrap`       | -                |
| `CallMethod`              | -                  | `CallMethodSelf` | `WrapMethod` | `WrapMethodSelf` |

---

## Exports

```ts
export { Middleware as Fn, Middlewares as Fns, MethodMiddleware as FnSelf, MethodMiddlewares as FnsSelf };
```

---

## Type Definitions

```ts
type EmptyObject = Record<string, unknown>;
type Args = Record<string, unknown>;
type MethodArgs<TSelf> = Args & { self: TSelf };

type Function = (args: Args) => unknown;
type Method<TSelf> = (args: MethodArgs<TSelf>) => unknown;

type MiddlewaresOf<TMiddleware> = TMiddleware | TMiddleware[];

type BaseMiddleware<TArgs extends Args, TRet = EmptyObject> = (args: TArgs) => TRet | void;
type BaseMiddlewares<TArgs extends Args, TRet = EmptyObject> = MiddlewaresOf<BaseMiddleware<TArgs, TRet>>;

type Middleware<TFunc extends Function = Function> = BaseMiddleware<Parameters<TFunc>[0], ReturnType<TFunc>>;
type Middlewares<TFunc extends Function = Function> = MiddlewaresOf<Middleware<TFunc>>;

type MethodMiddleware<TSelf, TMethod extends Method<TSelf> = Method<TSelf>> = BaseMiddleware<
	Parameters<TMethod>[0],
	ReturnType<TMethod>
>;
type MethodMiddlewares<TSelf, TMethod extends Method<TSelf> = Method<TSelf>> = MiddlewaresOf<
	MethodMiddleware<TSelf, TMethod>
>;

type KeyedMiddlewares<TSelf> = Record<keyof TSelf, Middlewares>;
type KeyedMethodMiddlewares<TSelf> = Record<keyof TSelf, MethodMiddlewares<TSelf>>;

type SelfWithMiddlewares<
	TSelf,
	TKeyedMiddlewares extends KeyedMiddlewares<TSelf>,
	TKeyedMethodMiddlewares extends KeyedMethodMiddlewares<TSelf>,
> = TSelf & {
	middlewares: TKeyedMiddlewares;
	methodMiddlewares: TKeyedMethodMiddlewares;
};
```

---

## Functions

### `Call`

```ts
function Call<TFunc extends Function>(
	args: Parameters<TFunc>[0],
	middlewares: Middlewares<TFunc>,
	func: (_args: typeof args) => ReturnType<TFunc>,
): ReturnType<TFunc>;
```

Wraps and executes a function with middleware(s).

---

### `Wrap`

```ts
function Wrap<TFunc extends Function>(
	middlewares: Middlewares<TFunc>,
	func: (_args: Parameters<TFunc>[0]) => ReturnType<TFunc>,
): typeof func;
```

Wraps a function, returning a new one with middleware behavior.

---

### `CallMethod`

```ts
function CallMethod<TSelf, TMethod extends Method<TSelf>>(
	selfObj: TSelf,
	args: Omit<Parameters<TMethod>[0], "self">,
	middlewares: MethodMiddlewares<TSelf, TMethod>,
	method: (selfObj: TSelf, _args: Parameters<TMethod>[0]) => ReturnType<TMethod>,
): ReturnType<TMethod>;
```

Same as `Call`, but for instance methods that require a `self`.

---

### `WrapMethod`

```ts
function WrapMethod<TSelf, TMethod extends Method<TSelf>>(
	middlewares: MethodMiddlewares<TSelf, TMethod>,
	method: (selfObj: TSelf, _args: Parameters<TMethod>[0]) => ReturnType<TMethod>,
): typeof method;
```

Same as `Wrap`, but for wrapping methods that receive a `self` reference.
