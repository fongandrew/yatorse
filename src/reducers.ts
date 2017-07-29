/*
  Reducer for our putState action
*/
import { Action } from "redux";
import { getMeta } from "./meta";
import { PutAction, FullConfig } from "./types";

export const isPutAction = (a: Action, conf: FullConfig): a is PutAction => {
  let meta = getMeta(a, conf);
  return !!meta[conf.putActionKey];
};

/*
  Recursively replaces some path in state with data.
  Creates nested objects as necessary to create path.
*/
const reduceSubState = (state: any, keys: string[], data: any): any => {
  if (keys.length) {
    let [key1, ...restKeys] = keys;
    state = state || {};
    return {
      ...state,
      [key1]: reduceSubState(state[key1], restKeys, data)
    };
  }
  return data;
};

/*
  Creates a reducer for PutActions. Don't do anything to handle undefined
  (initial) state since we don't want to override whatever the store creator
  is providing.
*/
export const reducePutFactory = (conf: FullConfig) =>
  <A extends Action>(state: any, action: A) => {
    if (isPutAction(action, conf)) {
      let { keys, data } = action.payload;
      return reduceSubState(state, keys || [], data);
    }
    return state;
  };
