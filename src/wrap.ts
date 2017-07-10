import { Action, Reducer } from "redux";
import Context from "./context";
import { EnhancedReducer } from "./types";

/*
  Wrapper that takes an enhanced reducer function and returns a normal
  state-only reducer. Used to ensure compatability with standard Redux.
*/
const wrap = <S, I = undefined>(r: EnhancedReducer<S>): Reducer<S> => {
  let lastInstance: I|undefined;
  let lastIteration: number|undefined;

  return <A extends Action>(currentState: S, action: A) => {
    /*
      New iteration => reset instance values. Instance var is intended only
      to be shared between multiple runs of same reducer responding to
      the same initial action.
    */
    if (Context.iteration !== lastIteration) {
      lastIteration = Context.iteration;
      lastInstance = undefined;
    }

    let {
      actions,
      effects,
      instance,
      state
    } = r(currentState, action, lastInstance); // Run original reducer

    // Update instance for next run
    lastInstance = instance;

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
  }
};

export default wrap;