/*
  The counterpart to wrap, retrieves continuation info from a reducer run
*/

import { Action, Dispatch, Reducer } from "redux";
import Context from "./context";
import { Effect, Update } from "./types";

/*
  Returns a Loop function (state + action => continuation) from a reducer.
  Type isn't quite the same as a Loop though because dispatch is optional
  for ease of testing (when Loop doesn't return effects).
*/
export const unwrap = <S>(reducer: Reducer<S>) =>
  (state: S, action: Action, dispatch?: Dispatch<S>) => {
    // Reset actions, effects
    Context.actions = [];
    Context.effects = [];
    Context.dispatch = dispatch;
    state = reducer(state, action);
    return {
      state,
      actions: Context.actions,
      effects: Context.effects
    };
  };

/*
  Like unwrap, but the function it returns re-reduces all continuation actions,
  so it only returns new state + effects.
*/
export const unwrapAll =
  <S>(reducer: Reducer<S>, opts: { maxIterations?: number } = {}) =>
  (state: S, action: Action, dispatch?: Dispatch<S>): Update<S> => {
    let actions = [action];
    let effects: Effect[] = [];
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
        let continuation = unwrap(reducer)(state, action, dispatch);
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

