import { Action, Reducer } from "redux";
import Context from "./context";
import { Loop } from "./types";

/*
  Wrapper that takes an enhanced reducer function and returns a normal
  state-only reducer. Used to ensure compatability with standard Redux.
*/
const wrap = <S>(r: Loop<S>): Reducer<S> => {
  return (currentState: S, action: Action) => {
    let {
      actions,
      effects,
      state
    } = r(currentState, action); // Run original reducer

    // Track actions to dispatch next
    if (actions instanceof Array) {
      Context.actions = Context.actions.concat(actions);
    } else if (actions) {
      Context.actions.push(actions);
    }

    // Track effects only if effects list in Context is not undefined
    if (Context.effects && effects) {
      if (effects instanceof Array) {
        Context.effects = Context.effects.concat(effects);
      } else {
        Context.effects.push(effects);
      }
    }

    return state;
  };
};

export default wrap;