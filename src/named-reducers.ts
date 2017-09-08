/*
  Types and helpers for creating, managing named reducers.
*/

import { Dispatch } from "redux";
import { FullConfig } from "./config";
import { setMeta } from "./utils";

/*
  A named reducer isn't strictly a reducer in the Redux sense but rather a
  reducer-like transformation of state that can be specifically targeted
  with a payload by a dispatch.
*/
export interface NamedReducer<S, P> {
  (state: S, payload: P): S;
}

/*
  Dispatches actions to target a specific reducer.
*/
export interface TargetedDispatch<S, P> {
  (payload: P): S;

  // Original named reducer used to define function.
  _reducer: NamedReducer<S, P>;

  /*
    Private function to modify targeted dispatch function so it's aware of
    what key it's been assigned to in the interface object. That name matters
    because the reducer can use it to identify the original function to call.
  */
  _setTargetedDispatchName: (name: string) => void;
}

// Typeguard for TargetedDispatch
export const isTargetedDispatch =
  (f: any): f is TargetedDispatch<any, any> => (
    typeof f === "function" &&
    typeof (f as TargetedDispatch<any, any>)._setTargetedDispatchName
             === "function"
  );

// Factory for function used to converted named reducers into targeted
// dispatch function / objects.
export const makeReduce =
  (domainName: string, dispatch: Dispatch<any>, conf: FullConfig) =>
  <S, P>(reducer: NamedReducer<S, P>): TargetedDispatch<S, P> => {
    let reducerName: string|undefined;
    let ret = ((payload: P) => {
      if (! reducerName) throw new Error("Reducer name not set");
      let type = typeof conf.targetedDispatchType === "string" ?
        conf.targetedDispatchType :
        conf.targetedDispatchType(domainName, reducerName, payload);
      let action = setMeta(
        { type, payload },
        conf.targetedDispatchKey,
        [domainName, reducerName]
      );
      dispatch(action);
    }) as TargetedDispatch<S, P>;

    ret._reducer = reducer;
    ret._setTargetedDispatchName = (name: string) => {
      reducerName = name;
    };

    return ret;
  };