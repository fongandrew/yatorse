import {
  Action, Dispatch, StoreEnhancer, Reducer, Store,
  Unsubscribe
} from "redux";
import { createDebouncer } from "./debouncer";
import { getMeta, setMeta } from "./fingerprinting";
import { reducePutFactory } from "./reducers";
import { createGetState, createPutState } from "./state-managers";
import { Debouncer, Config, FullConfig, Proc } from "./types";
import { idFn } from "./utils";

// Wrap reducer to handle putState actions -- putState runs first
export const wrapReducer = <S>(reducer: Reducer<S>, conf: FullConfig) => {
  const reducePut = reducePutFactory(conf.putActionConf);
  return <A extends Action>(state: S, action: A) => {
    /*
      Important to run original reducer first so as to set initial state
      if necessary.
    */
    state = reducer(state, action);
    return reducePut(state, action);
  };
};

// Wrap dispatch to call proc function
export const wrapDispatch = <S>(next: Dispatch<S>, props: {
  proc: Proc<S>,
  debouncer: Debouncer,
  getState: () => S
}, conf: FullConfig) => {
  let { proc, debouncer, getState } = props;

  // Note the absence of flush here
  const dispatch = <A extends Action>(action: A) => {
    /*
      Reference dispatch that we will pass to proc. This gets modified
      by fingerprint if applicable.
    */
    let wrappedDispatch = dispatch;

    // Modify action and dispatch to fingerprint for subsequent dispatches
    if (conf.fingerprinting) {
      let id = conf.idFn(action);
      let meta = getMeta(action, conf);
      action = setMeta(action, { [conf.idKey]: id }, conf);

      // Set parent and origin for re-dispatch
      wrappedDispatch = (action) => dispatch(setMeta(action, {
        [conf.parentKey]: id,
        [conf.originKey]: meta[conf.originKey] || id
      }, conf));
    }

    // Reducer responds before proc
    let ret = next(action);

    // Then run proc with hooks
    proc(action, {
      dispatch: wrappedDispatch,
      getState: createGetState(getState),
      putState: createPutState(
        action,
        wrappedDispatch,
        getState,
        conf.putActionConf
      )
    });

    return ret;
  };

  /*
    Flush here. This ensures that only direct, synchronous calls to
    dispatch get flushed.
  */
  return <A extends Action>(action: A) => {
    let ret = dispatch(action);

    // Flush so normal dispatches get processed synchronously
    debouncer.flush();

    return ret;
  };
};

// Wrap subscribe functionality to implement debounce
export const wrapSubscribe =
  (subscribe: Store<any>["subscribe"], debouncer: Debouncer) =>
  (listener: () => void): Unsubscribe =>
  subscribe(debouncer.debounce(listener));


// Simplified type since we only care about reducer here
export interface SimplifiedStoreCreator<S> {
  (reducer: Reducer<S>, ...args: any[]): Store<S>;
}

// See Config type for details.
const DEFAULT_CONFIG: FullConfig = {
  fingerprinting: true,
  idKey: "__id",
  originKey: "__origin",
  parentKey: "__parent",
  idFn,

  // Put action if it sends with /PUT
  putActionConf: {
    type: (action) => action.type + "/PUT",
    test: (type) => {
      // string.endsWith("/PUT") with legacy browser supports
      const suffix = "/PUT";
      const n = type.lastIndexOf(suffix);
      return n >= 0 && n === type.length - suffix.length;
    }
  }
};

const enhancerFactory =
  <S>(proc: Proc<S>, conf: Config = {}): StoreEnhancer<S> =>
  (next: SimplifiedStoreCreator<S>) =>
  (reducer: Reducer<S>, ...args: any[]) => {
    let fullConf = { ...DEFAULT_CONFIG, ...conf };
    let debouncer = createDebouncer();
    let store = next(wrapReducer(reducer, fullConf), ...args);
    let dispatch = wrapDispatch(store.dispatch, {
      proc,
      debouncer,
      getState: store.getState
    }, fullConf);
    let subscribe = wrapSubscribe(store.subscribe, debouncer);
    return {
      ...store,
      dispatch,
      subscribe
    };
  };

export default enhancerFactory;