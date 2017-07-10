import { CallEffect, CallEffectFn, CallEffectNamedFn } from "./types";

/*
  Helpers to type call effects. Almost identical to how Redux Saga does this.
*/
export type Func0 = () => any;
export type Func1<T1> = (t1: T1) => any;
export type Func2<T1, T2> = (t1: T1, t2: T2) => any;
export type Func3<T1, T2, T3> = (t1: T1, t2: T2, t3: T3) => any;
export type Func4<T1, T2, T3, T4> = (t1: T1, t2: T2, t3: T3, t4: T4) => any;
export type Func5<T1, T2, T3, T4, T5> = (
  t1: T1, t2: T2, t3: T3, t4: T4, arg5: T5
) => any;
export type Func6Rest<T1, T2, T3, T4, T5, T6> = (
  t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, ...rest: any[]
) => any;

export interface CallEffectFactory<R> {
  (fn: CallEffectFn<Func0>): R;
  <T1>(fn: CallEffectFn<Func1<T1>>,
       arg1: T1): R;
  <T1, T2>(fn: CallEffectFn<Func2<T1, T2>>,
           arg1: T1, arg2: T2): R;
  <T1, T2, T3>(fn: CallEffectFn<Func3<T1, T2, T3>>,
               arg1: T1, arg2: T2, arg3: T3): R;
  <T1, T2, T3, T4>(fn: CallEffectFn<Func4<T1, T2, T3, T4>>,
                   arg1: T1, arg2: T2, arg3: T3, arg4: T4): R;
  <T1, T2, T3, T4, T5>(fn: CallEffectFn<Func5<T1, T2, T3, T4, T5>>,
                       arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): R;
  <T1, T2, T3, T4, T5, T6>(fn: CallEffectFn<Func6Rest<T1, T2, T3, T4, T5, T6>>,
                           arg1: T1, arg2: T2, arg3: T3,
                           arg4: T4, arg5: T5, arg6: T6, ...rest: any[]): R;

  <C extends {[P in N]: Func0}, N extends string>(
    fn: CallEffectNamedFn<C, N>): R;
  <C extends {[P in N]: Func1<T1>}, N extends string,  T1>(
    fn: CallEffectNamedFn<C, N>,
    arg1: T1): R;
  <C extends {[P in N]: Func2<T1, T2>}, N extends string, T1, T2>(
    fn: CallEffectNamedFn<C, N>,
    arg1: T1, arg2: T2): R;
  <C extends {[P in N]: Func3<T1, T2, T3>}, N extends string,
   T1, T2, T3>(
    fn: CallEffectNamedFn<C, N>,
    arg1: T1, arg2: T2, arg3: T3): R;
  <C extends {[P in N]: Func4<T1, T2, T3, T4>}, N extends string,
   T1, T2, T3, T4>(
    fn: CallEffectNamedFn<C, N>,
    arg1: T1, arg2: T2, arg3: T3, arg4: T4): R;
  <C extends {[P in N]: Func5<T1, T2, T3, T4, T5>}, N extends string,
   T1, T2, T3, T4, T5>(
    fn: CallEffectNamedFn<C, N>,
    arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): R;
  <C extends {[P in N]: Func6Rest<T1, T2, T3, T4, T5, T6>}, N extends string,
   T1, T2, T3, T4, T5, T6>(
    fn: CallEffectNamedFn<C, N>,
    arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6,
    ...rest: any[]): R;
}

/*
  Returns a declarative call effect. Helps with type inferrence.
*/
const call: CallEffectFactory<CallEffect> = (
  arg1: CallEffectFn<Function>|
        CallEffectNamedFn<{ [index: string]: Function }, string>,
  ...args: any[]
) => {
  let context: any = null;
  let fn: Function|undefined;
  if (typeof arg1 === "function") {
    fn = arg1;
  } else {
    let fnParam: string|Function;
    if (arg1 instanceof Array) {
      [context, fnParam] = arg1;
    } else {
      ({ context, fn: fnParam } = arg1);
    }
    if (typeof fnParam === "function") {
      fn = fnParam;
    } else {
      if (! context) {
        throw new Error("Function is string but no context provided.");
      }
      fn = context[fnParam];
    }
  }
  if (typeof fn !== "function") {
    throw new Error("No function provided.");
  }
  return { context, fn, args };
};

export default call;