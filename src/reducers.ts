/*
  Reducer for our putState action
*/
import { Action } from "redux";
import { PutAction } from "./types";

export const isPutAction = (a: Action): a is PutAction => {
  return (a as PutAction).__putAction === true;
};

/*
  Recursive implementation of reducePut
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
  Reduces PutActions. Uses array of strings as a path to some variable
  we want to replace. Creates nested objects as necessary to create path.
  Don't do anything to handle undefined (initial) state since we don't want
  to override whatever the store creator is providing.
*/
export const reducePut = (state: any, action: Action) => {
  if (isPutAction(action)) {
    let { keys, data } = action.payload;
    return reduceSubState(state, keys || [], data);
  }
  return state;
};