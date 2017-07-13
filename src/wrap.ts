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
    if (actions) {
      Context.actions = Context.actions.concat(actions);
    }

    // Track effects only if effects list in Context is not undefined
    if (effects) {
      Context.effects = Context.effects.concat(effects);
    }

    return state;
  };
};

export default wrap;