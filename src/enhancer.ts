import { Action, Dispatch, GenericStoreEnhancer, Reducer, Store } from "redux";
import Context from "./context";
import { Effect, Config, FullConfig } from "./types";
import { unwrapAll } from "./unwrap";


let nextDispatch: Dispatch<any>|undefined;

// Higher order reducer that uses context to track continuation actions
const wrapReducer = <S>(reducer: Reducer<S>, config: FullConfig) =>
  (state: S, action: Action) => {
    let update = unwrapAll(reducer, config)(state, action, nextDispatch);
    Context.effects = update.effects || [];
    return update.state;
  };


// Middleware, dispatch wrapper to handle effects. Unlike
const wrapDispatch = <S>(dispatch: Dispatch<S>, config: FullConfig) => {
  let wrappedDispatch: Dispatch<S> = <A extends Action>(action: A): A => {
    let ret: A;
    let effects: typeof Context.effects;
    nextDispatch = wrappedDispatch;

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
      nextDispatch = (action: Action) => wrappedDispatch({
        ...(action as Action),
        ...nextFingerprint
      });
    }

    try {
      ret = dispatch(action);
      effects = Context.effects;
    } finally {
      /*
        Always unset dispatch so any subsequent reductions outside of dispatch
        don't trigger side effects.
      */
      nextDispatch = undefined;
    }

    if (! config.disableEffects) {
      nextTick(() => execEffects(effects || []));
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