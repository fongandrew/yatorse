import { Action, Dispatch, Reducer } from "redux";
import { Loop, Effect, Update } from "./types";

/*
  Context object for passing dispatch to and effects and actions from our
  wrapped reducer.
*/
export const Context = {
  actions: [] as Action[],
  effects: [] as Effect[],
  dispatch: undefined as Dispatch<any>|undefined
};

/*
  No-op default in case dispatch is unavilable and we want to invoke our
  reducer like a normal Redux reducer.
*/
const ident = <A>(a: A) => a;

/*
  Wrapper that takes an enhanced reducer function and returns a normal
  state-only reducer. Used to ensure compatability with standard Redux.
*/
export const wrap = <S>(r: Loop<S>): Reducer<S> => {
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
  so it only returns new state + effects. Returned function also takes optional
  dispatch. Dispatch need only be provided if we're actually processing effects.
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