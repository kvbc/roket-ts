/*
 * Roket :: Function
 * RFunction
 */

type Fn<TArgs = unknown, TRet = unknown, TThis = unknown> = TThis extends undefined
	? (args: TArgs, thisArg?: TThis) => TRet
	: (args: TArgs, thisArg: TThis) => TRet;
type FnArgs<TFunc extends Fn> = Parameters<TFunc>[0];
type FnThis<TFunc extends Fn> = Parameters<TFunc>[1];
type FnRet<TFunc extends Fn> = ReturnType<TFunc>;

export { Fn, FnArgs as Args, FnThis as This, FnRet as Ret };
