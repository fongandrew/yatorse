import { Action, Dispatch, GenericStoreEnhancer, Reducer, Store } from "redux";
import Context from "./context";
import { CallEffect, Config, FullConfig, EffectsFn } from "./types";

// Higher order reducer that uses context to track continuation actions
const wrapReducer = <S>(reducer: Reducer<S>, config: FullConfig) =>
  (state: S, action: Action) => {
    // Reset context vars because it's a new reduction
    Context.actions = [action];
    Context.iteration += 1;

    // Loop until no more new actions in context
    let maxIterations = config.maxIterations;
    let iterCount = 0;
    while (Context.actions.length) {
      if (++iterCount > maxIterations) {
        throw new Error(
          `Reducer iterations exceeds ${maxIterations} iterations. ` +
          `Set maxIterations config to change behavior.`
        );
      }
      let currentActions = Context.actions;
      Context.actions = [];
      state = currentActions.reduce<S>(reducer, state);
    }

    return state;
  };


// Middleware, dispatch wrapper to handle effects. Unlike
const wrapDispatch = <S>(dispatch: Dispatch<S>, config: FullConfig) => {
  let wrappedDispatch: Dispatch<S> = <A extends Action>(action: A): A => {
    // Reset effect tracking
    Context.effects = [];
    let ret: A;
    let effects: typeof Context.effects;

    // Fingerprint action
    const id = config.idFn(action);
    action = {
      ...(action as Action),
      [config.metaKey]: {
        [config.idKey]: id,
        ...((action as any).meta || {})
      }
    } as A;

    try {
      ret = dispatch(action);
      effects = Context.effects;
    } finally {
      /*
        Always unset effects so any subsequent reductions outside of dispatch
        don't trigger side effects.
      */
      delete Context.effects;
    }

    /*
      Wrapped the dispatch function we give to function for processing
      effects so it records origin.
    */
    let effectsDispatch = (action: Action) => wrappedDispatch({
      ...(action as Action),
      [config.metaKey]: {
        [config.originKey]: id,
        ...((action as any).meta || {})
      },
    });

    if (! config.disableSideEffects) {
      nextTick(() => execEffects(
        effects || [],
        effectsDispatch as Dispatch<S>
      ));
    }

    // Return original return value from wrapped dispatch call.
    return ret;
  };

  return wrappedDispatch;
};


/*
  Helper function to run next frame across different environments.
*/
const nextTick = (fn: Function) => {
  if (typeof setImmediate !== "undefined") {
    setImmediate(fn);
  }
  else if (typeof requestAnimationFrame !== "undefined") {
    requestAnimationFrame(() => fn());
  }
  else if (typeof process !== "undefined" && process.nextTick) {
    process.nextTick(fn);
  }
  else {
    setTimeout(fn, 0);
  }
};
declare var process: any; // For process.nextTick call above

// Execute callback effect functions
const execEffects = <S>(
  effects: (EffectsFn|CallEffect)[],
  dispatch: Dispatch<S>
) => {
  let callEffects: CallEffect[] = [];

  // Run functions to get declarative CallEffects objects
  for (let i in effects) {
    let effect = effects[i];
    if (typeof effect === "function") {
      let ret = effect(dispatch);
      if (ret instanceof Array) {
        callEffects = callEffects.concat(ret);
      } else if (ret) {
        callEffects.push(ret);
      }
    } else {
      callEffects.push(effect);
    }
  }

  // Run declarative call effects
  for (let i in callEffects) {
    let { fn, args, context } = callEffects[i];
    fn.apply(context, args);
  }
};


//////

// Simplified type since we only care about reducer here
export interface SimplifiedStoreCreator<S> {
  (reducer: Reducer<S>, ...args: any[]): Store<S>;
}

// Default function for generating IDs for functions. Just use
// iterating number.
const idFn = (() => {
  let count = 0;
  return (action: Action) => `${action.type}-${++count}`;
})();

// See Config type for details.
const DEFAULT_CONFIG: FullConfig = {
  maxIterations: 15,
  disableSideEffects: false,
  metaKey: "meta",
  idKey: "id",
  originKey: "origin",
  idFn
};

const enhancerFactory = (conf: Config = {}): GenericStoreEnhancer =>
  <S>(next: SimplifiedStoreCreator<S>) =>
  (reducer: Reducer<S>, ...args: any[]) => {
    let fullConf = { ...DEFAULT_CONFIG, ...conf };
    let store = next(wrapReducer(reducer, fullConf), ...args);
    let dispatch = wrapDispatch(store.dispatch, fullConf);
    return {
      ...store,
      dispatch
    };
  };

export default enhancerFactory;