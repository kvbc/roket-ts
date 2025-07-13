/**
 *
 * Roket :: Middleware
 *
 * @file Provides utility functions and types for dealing with middlewares for functions
 * @module Roket
 * @author kvbc
 * @version 1.0.0
 *
 * @example
 *
 * ```ts
 * export default class Car {
 * 	private brand: string;
 * 	private color: string;
 * 	private mileage: number;
 * 	public middlewares: Middleware.Middlewares<Car>;
 *
 * 	constructor(brand: string, color: string, mileage: number) {
 * 		this.brand = brand;
 * 		this.color = color;
 * 		this.mileage = mileage;
 * 		this.middlewares = {
 * 			Drive: {
 * 				before: [
 * 					(args, car) => {
 * 						print(args);
 * 					},
 * 				],
 * 			},
 * 		};
 * 	}
 *
 * 	public Drive = Middleware.WrapKey<(args: { distance: number }, car: Car) => void>("Drive", (args, car) => {
 * 		car.mileage += args.distance;
 * 		return {};
 * 	});
 * }
 * ```
 *
 * ```ts
 * function myPrint(args: { message: string; color?: string }) {
 * 	print(`Hello! ${args.message}`);
 * }
 *
 * const mentionColorMiddleware: Middleware.Fn<typeof myPrint> = (args) => {
 * 	args.message += ` (i like ${args.color})`;
 * };
 *
 * const specialPrint = Middleware.Wrap(
 * 	{
 * 		before: [mentionColorMiddleware],
 * 	},
 * 	myPrint,
 * );
 *
 * export default class Test {
 * 	static RoketStart() {
 * 		print("test service started");
 * 		//#server
 * 		print("server");
 * 		myPrint({ message: "whats up?" });
 * 		//#client
 * 		print("client");
 * 		specialPrint({ message: "aight thats my special print because", color: "pink" });
 * 		// Middleware.Call(myPrint, mentionColorMiddleware, { message: "this is not a joke", color: "red" });
 * 		//#end
 * 	}
 * }
 *
 * ```
 *
 */

import { RFn } from "./RFunction";

type Middleware<TFn extends RFn.Fn = RFn.Fn> = RFn.Fn<RFn.Args<TFn>, RFn.Ret<TFn> | void, RFn.This<TFn>>;
type Middlewares<TFn extends RFn.Fn = RFn.Fn> = Partial<{
	before: Middleware<TFn>[];
	after: Middleware<TFn>[];
}>;
type KeyedMiddlewares<_TSelf extends { middlewares: unknown }, TSelf = Omit<_TSelf, "middlewares">> = Partial<{
	[K in keyof TSelf as TSelf[K] extends RFn.Fn ? K : never]: TSelf[K] extends RFn.Fn ? Middlewares<TSelf[K]> : never;
}>;

export { Middleware as Fn, Middlewares as Fns, KeyedMiddlewares as Middlewares };

export function call<TFn extends RFn.Fn>(
	args: RFn.Args<TFn>,
	middlewares: Middlewares<TFn>,
	fn: TFn,
	fnThis: RFn.This<TFn>,
): RFn.Ret<TFn> {
	for (const middleware of middlewares.before ?? []) {
		const ret: unknown = middleware(args, fnThis);
		if (ret !== undefined) {
			return ret as RFn.Ret<TFn>;
		}
	}

	const funcRet = fn(args, fnThis);

	for (const middleware of middlewares.after ?? []) {
		const ret: unknown = middleware(args, fnThis) as RFn.Ret<TFn>;
		if (ret !== undefined) {
			return ret as RFn.Ret<TFn>;
		}
	}

	return funcRet;
}

/*
 * Call given function with given args, and middlewares
 */
export function Call<TFn extends RFn.Fn>(
	args: RFn.Args<TFn>,
	middlewares: Middlewares<TFn>,
	fn: RFn.Fn<RFn.Args<TFn>, RFn.Ret<TFn>, undefined>,
): RFn.Ret<TFn> {
	return call<typeof fn>(args, middlewares, fn, undefined);
}

export function Wrap<TFn extends RFn.Fn>(
	middlewares: Middlewares<TFn>,
	func: RFn.Fn<RFn.Args<TFn>, RFn.Ret<TFn>, undefined>,
): (args: RFn.Args<TFn>) => RFn.Ret<TFn> {
	return (args) => {
		return Call<TFn>(args, middlewares, func);
	};
}

/*
 * Wrap given function with given middlewares.
 */
export function WrapKey<
	TFn extends RFn.Fn<any, any, TSelf>, // eslint-disable-line
	TSelf extends { middlewares: KeyedMiddlewares<TSelf> } = any, // eslint-disable-line
>(key: keyof RFn.This<TFn>, func: TFn): (this: RFn.This<TFn>, args: RFn.Args<TFn>) => RFn.Ret<TFn> {
	return function (args) {
		const nokeyMiddlewares: Middlewares<TFn> = {
			before: [],
			after: [],
		};
		const middlewares: Middlewares<TFn> =
			key === undefined ? nokeyMiddlewares : (this.middlewares[key] ?? nokeyMiddlewares);
		return call<TFn>(args, middlewares, func, this);
	};
}
