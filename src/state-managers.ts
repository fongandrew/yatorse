/*
  Set up getState / putState functions to pass to proc
*/

import { Dispatch } from "redux";
import { GetStateFn, PutStateFn, PutAction } from "./types";

// Helper to iterate over key list and get or create objects as necessary
const getKeyState = (state: any, args: string[]) => {
  for (let i = 0; i < args.length; i++) {
    state = (state || {})[args[i]];
  }
  return state;
};

/*
  Creates a key-array getState hook for procs

  Note that the type for storeGetState isn't quite accurate. It's actually
  OK for the store to return a variant of the state where any nested object
  could be a partial, i.e. if storeGetState returns this:

    type DeepPartial<S> = { [K in keyof S]?: DeepPartial<S[K]> };

  Unfortunately, this messes with type inference so it's easier to just
  keep it as for now.
*/
export const createGetState = <S>(storeGetState: () => S): GetStateFn<S> =>
  (...args: string[]) => getKeyState(storeGetState(), args);

// Creates a key-array putState hook for procs
export const createPutState =
  <S>(dispatch: Dispatch<S>, getState: () => S): PutStateFn<S> =>
  (...args: any[]) => {
    if (args.length < 1) {
      throw new Error("putState expects at least one arg");
    }

    let fn = args[args.length - 1];
    if (typeof fn !== "function") {
      throw new Error("Last arg to putState must be a function");
    }

    let state = getState();
    let keys = args.slice(0, -1);
    let substate = getKeyState(state, keys);
    let action: PutAction = {
      type: "PUT",
      payload: {
        keys,
        data: fn(substate)
      },
      __putAction: true
    };
    return dispatch(action);
  };
