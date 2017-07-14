import { Action, Dispatch, GenericStoreEnhancer, Reducer, Store } from "redux";
import { Effect, Config, FullConfig } from "./types";
import { unwrapAll } from "./wrap";


/*
  Context object to pass effects and dispatch function between reducer and
  dispatch scopes. Used only in this module, but export to allow debugging.
*/
export const Context = {
  dispatch: undefined as Dispatch<any>|undefined,
  effects: [] as Effect[]
};


// Higher order reducer that uses context to track continuation actions
const wrapReducer = <S>(reducer: Reducer<S>, config: FullConfig) =>
  (state: S, action: Action) => {
    let update = unwrapAll(reducer, config)(state, action, Context.dispatch);
    Context.effects = update.effects || [];
    return update.state;
  };


// Middleware, dispatch wrapper to handle effects.
const wrapDispatch = <S>(dispatch: Dispatch<S>, config: FullConfig) => {
  let wrappedDispatch: Dispatch<S> = <A extends Action>(action: A): A => {
    // Set the dispatch function used by reducer
    Context.dispatch = wrappedDispatch;

    // Fingerprint action, determine origin if any
    if (config.fingerprinting) {
      let id = config.idFn(action);
      let meta = (config.metaKey && (action as any)[config.metaKey]);
      let origin =
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

      // Update the current action
      action = {
        ...(action as Action),
        ...fingerprint
      } as A;

      /*
        Wrap dispatch so it records origin and parent for actions dispatched
        as effects of the current action.
      */
      let nextFingerprint: any = {
        [config.parentKey]: id,
        [config.originKey]: origin
      };
      if (config.metaKey) {
        nextFingerprint = {
          [config.metaKey]: {
            ...((action as any)[config.metaKey] || {}),
            ...nextFingerprint
          }
        };
      }
      Context.dispatch = (action: Action) => wrappedDispatch({
        ...(action as Action),
        ...nextFingerprint
      });
    }

    let ret: A;
    try {
      ret = dispatch(action);
    } finally {
      /*
        Always unset Context.dispatch so any subsequent runs of reducer
        outside of this dispatch function don't trigger side effects.
      */
      Context.dispatch = undefined;
    }

    // Schedule effects for after reducer completion.
    if (! config.disableEffects) {
      nextTick(() => execEffects(Context.effects));
    }

    // Return original return value from wrapped dispatch call.
    return ret;
  };

  return wrappedDispatch;
};


/*
  Helper function to With next frame across different environments.
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
const execEffects = (effects: Effect[]) => {
  for (let i in effects) {
    let { fn, context, args } = effects[i];
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
  disableEffects: false,
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