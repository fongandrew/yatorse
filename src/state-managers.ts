/*
  Set up getState / putState functions to pass to proc
*/

import { Action, Dispatch } from "redux";
import { setMeta } from "./meta";
import { GetStateFn, PutStateFn, PutAction, FullConfig } from "./types";

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
export const createPutState = <S>(
  action: Action,
  dispatch: Dispatch<S>,
  getState: () => S,
  conf: FullConfig
): PutStateFn<S> => (...args: any[]) => {
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
  let type = typeof conf.putActionType === "string" ?
    conf.putActionType : conf.putActionType(action);
  let putAction: PutAction = {
    type,
    payload: {
      keys,
      data: fn(substate)
    }
  };
  return dispatch(setMeta(putAction, {
    [conf.putActionKey]: true
  }, conf));
};
