/*
  Reducer for our putState action
*/
import { Action } from "redux";

export interface PutAction {
  type: string;
  payload: {
    keys?: string[];
    data: any;
  };

  // How we identify PutAction (since type may vary)
  __putAction: true;
}

const isPutAction = (a: Action): a is PutAction => {
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
*/
export const reducePut = (state: any = {}, action: Action) => {
  if (isPutAction(action)) {
    let { keys, data } = action.payload;
    return reduceSubState(state, keys || [], data);
  }
  return state;
};