/*
  The counterpart to wrap, retrieves continuation info from a reducer run
*/

import { Action, Reducer } from "redux";
import Context from "./context";
import { CallEffect, Loop, ReducerPlus } from "./types";

/*
  Returns a Loop function (state + action => continuation) from a reducer.

*/
export const unwrap = <S>(reducer: Reducer<S>): Loop<S> => {
  return (state: S, action: Action) => {
    // Reset actions, effects
    Context.actions = [];
    Context.effects = [];
    state = reducer(state, action);
    return {
      state,
      actions: Context.actions,
      effects: Context.effects
    };
  };
};

/*
  Like unwrap, but the function it returns re-reduces all continuation actions,
  so it only returns new state + effects.
*/
export const unwrapAll = <S>(reducer: Reducer<S>, opts: {
  maxIterations?: number
} = {}): ReducerPlus<S> => {
  return (state: S, action: Action) => {
    let actions = [action];
    let effects: CallEffect[] = [];
    let iterCount = 0;
    let maxIterations = opts.maxIterations || 15;
    while (actions.length) {
      if (++iterCount > maxIterations) {
        throw new Error(
          `Reducer iterations exceeds ${maxIterations} iterations. ` +
          `Set maxIterations config to change behavior.`
        );
      }

      let newActions: Action[] = [];
      actions.forEach((action) => {
        let continuation = unwrap(reducer)(state, action);
        if (continuation.actions) {
          newActions = newActions.concat(continuation.actions);
        }
        if (continuation.effects) {
          effects = effects.concat(continuation.effects);
        }
        state = continuation.state;
      });
      actions = newActions;
    }

    return { state, effects };
  };
};
