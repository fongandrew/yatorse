import { Action, Reducer } from "redux";
import Context from "./context";
import { Loop } from "./types";

// No-op default in case dispatch is unavilable and we want to invoke our
// reducer like a normal Redux reducer
const ident = <A>(a: A) => a;

/*
  Wrapper that takes an enhanced reducer function and returns a normal
  state-only reducer. Used to ensure compatability with standard Redux.
*/
const wrap = <S>(r: Loop<S>): Reducer<S> => {
  return (currentState: S, action: Action) => {
    let dispatch = Context.dispatch || ident;
    let {
      actions,
      effects,
      state
    } = r(currentState, action, dispatch); // Run original reducer

    // Track actions to dispatch next
    if (actions) {
      Context.actions = Context.actions.concat(actions);
    }

    // Track effects only if effects list in Context is not undefined
    if (effects) {
      Context.effects = Context.effects.concat(effects);
    }

    return (typeof state === "undefined" ? currentState : state);
  };
};

export default wrap;