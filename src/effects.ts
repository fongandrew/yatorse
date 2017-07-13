import { Effect, EffectFn, EffectNamedFn } from "./types";

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

export interface EffectFactory<R> {
  (fn: EffectFn<Func0>): R;
  <T1>(fn: EffectFn<Func1<T1>>,
       arg1: T1): R;
  <T1, T2>(fn: EffectFn<Func2<T1, T2>>,
           arg1: T1, arg2: T2): R;
  <T1, T2, T3>(fn: EffectFn<Func3<T1, T2, T3>>,
               arg1: T1, arg2: T2, arg3: T3): R;
  <T1, T2, T3, T4>(fn: EffectFn<Func4<T1, T2, T3, T4>>,
                   arg1: T1, arg2: T2, arg3: T3, arg4: T4): R;
  <T1, T2, T3, T4, T5>(fn: EffectFn<Func5<T1, T2, T3, T4, T5>>,
                       arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): R;
  <T1, T2, T3, T4, T5, T6>(fn: EffectFn<Func6Rest<T1, T2, T3, T4, T5, T6>>,
                           arg1: T1, arg2: T2, arg3: T3,
                           arg4: T4, arg5: T5, arg6: T6, ...rest: any[]): R;

  <C extends {[P in N]: Func0}, N extends string>(
    fn: EffectNamedFn<C, N>): R;
  <C extends {[P in N]: Func1<T1>}, N extends string,  T1>(
    fn: EffectNamedFn<C, N>,
    arg1: T1): R;
  <C extends {[P in N]: Func2<T1, T2>}, N extends string, T1, T2>(
    fn: EffectNamedFn<C, N>,
    arg1: T1, arg2: T2): R;
  <C extends {[P in N]: Func3<T1, T2, T3>}, N extends string,
   T1, T2, T3>(
    fn: EffectNamedFn<C, N>,
    arg1: T1, arg2: T2, arg3: T3): R;
  <C extends {[P in N]: Func4<T1, T2, T3, T4>}, N extends string,
   T1, T2, T3, T4>(
    fn: EffectNamedFn<C, N>,
    arg1: T1, arg2: T2, arg3: T3, arg4: T4): R;
  <C extends {[P in N]: Func5<T1, T2, T3, T4, T5>}, N extends string,
   T1, T2, T3, T4, T5>(
    fn: EffectNamedFn<C, N>,
    arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): R;
  <C extends {[P in N]: Func6Rest<T1, T2, T3, T4, T5, T6>}, N extends string,
   T1, T2, T3, T4, T5, T6>(
    fn: EffectNamedFn<C, N>,
    arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6,
    ...rest: any[]): R;
}

/*
  Returns a declarative call effect. Helps with type inferrence.
*/
export const call: EffectFactory<Effect> = (
  arg1: EffectFn<Function>|
        EffectNamedFn<{ [index: string]: Function }, string>,
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
