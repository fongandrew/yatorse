import { Action, Reducer } from "redux";
import Context from "./context";
import { Loop } from "./types";

/*
  Wrapper that takes an enhanced reducer function and returns a normal
  state-only reducer. Used to ensure compatability with standard Redux.
*/
const wrap = <S>(r: Loop<S>): Reducer<S> => {
  /*
    Iteration = how many times has dispatch been called?
  */
  let lastIteration: number|undefined;

  /*
    Instance = How many times has this particular reducer been run during
    this iteration?
  */
  let lastInstance = 0;

  return (currentState: S, action: Action) => {
    /*
      New iteration => reset instance values. Instance var is intended only
      to be shared between multiple runs of same reducer responding to
      the same initial action.
    */
    if (Context.iteration !== lastIteration) {
      lastIteration = Context.iteration;
      lastInstance = 0;
    }

    let {
      actions,
      effects,
      state
    } = r(currentState, action, lastInstance); // Run original reducer

    // Update instance for next run
    lastInstance++;

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