import { Action, Dispatch, GenericStoreEnhancer, Reducer, Store } from "redux";
import Context from "./context";
import { CallEffect, Config, FullConfig } from "./types";
import { unwrapAll } from "./unwrap";

// Higher order reducer that uses context to track continuation actions
const wrapReducer = <S>(reducer: Reducer<S>, config: FullConfig) =>
  (state: S, action: Action) => {
    let update = unwrapAll(reducer, config)(state, action);
    Context.effects = update.effects || [];
    return update.state;
  };


// Middleware, dispatch wrapper to handle effects. Unlike
const wrapDispatch = <S>(dispatch: Dispatch<S>, config: FullConfig) => {
  let wrappedDispatch: Dispatch<S> = <A extends Action>(action: A): A => {
    // Reset effect tracking
    Context.effects = [];
    let ret: A;
    let effects: typeof Context.effects;

    // Fingerprint action, determine origin if any
    let id: string|undefined;
    let origin: string|undefined;
    if (config.fingerprinting) {
      id = config.idFn(action);
      let meta = (config.metaKey && (action as any)[config.metaKey]);
      origin =
        (meta && meta[config.originKey]) ||
        (action as any)[config.originKey] ||
        id;

      let fingerprint: any = {
        [config.idKey]: id,
        [config.originKey]: origin
      };
      if (config.metaKey) {
        fingerprint = {
          [config.metaKey]: {
            ...(meta || {}),
            ...fingerprint
          }
        };
      }

      action = {
        ...(action as Action),
        ...fingerprint
      } as A;
    }

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
    let fingerprint: any = (id && origin) ? {
      [config.parentKey]: id,
      [config.originKey]: origin
    } : {};
    if (config.metaKey) {
      fingerprint = {
        [config.metaKey]: {
          ...((action as any)[config.metaKey] || {}),
          ...fingerprint
        }
      };
    }
    let effectsDispatch = (action: Action) => wrappedDispatch({
      ...(action as Action),
      ...fingerprint
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
  effects: CallEffect[],
  dispatch: Dispatch<S>
) => {
  Context.dispatch = dispatch;
  try {
    // Run declarative call effects
    for (let i in effects) {
      let { fn, args, context } = effects[i];
      fn.apply(context, args);
    }
  }
  finally {
    delete Context.dispatch;
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
  fingerprinting: true,
  idKey: "__id",
  originKey: "__origin",
  parentKey: "__parent",
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