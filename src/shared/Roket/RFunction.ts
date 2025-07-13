/*
 * Roket :: Function
 * RFunction
 */

export namespace RFn {
	export type Fn<TArgs = any, TRet = any, TThis = any> = TThis extends undefined // eslint-disable-line
		? (args: TArgs, thisArg?: TThis) => TRet
		: (args: TArgs, thisArg: TThis) => TRet;
	export type Args<TFunc extends Fn> = Parameters<TFunc>[0];
	export type This<TFunc extends Fn> = Parameters<TFunc>[1];
	export type Ret<TFunc extends Fn> = ReturnType<TFunc>;
}
