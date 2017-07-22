import {
  Action, Dispatch, StoreEnhancer, Reducer, Store,
  Unsubscribe
} from "redux";
import { createDebouncer } from "./debouncer";
import { reducePut } from "./reducers";
import { createGetState, createPutState } from "./state-managers";
import { Debouncer, Config, FullConfig, Proc } from "./types";
import { idFn } from "./utils";

// Wrap reducer to handle putState actions -- putState runs first
export const wrapReducer = <S>(reducer: Reducer<S>) =>
  <A extends Action>(state: S, action: A) => {
    /*
      Important to run original reducer first so as to set initial state
      if necessary.
    */
    state = reducer(state, action);
    return reducePut(state, action);
  };

// Wrap dispatch to call proc function
export const wrapDispatch = <S>(next: Dispatch<S>, props: {
  proc: Proc<S>,
  debouncer: Debouncer,
  getState: () => S
}, conf: Config) => {
  let { proc, debouncer, getState } = props;

  // Note the absence of flush here
  const dispatch = <A extends Action>(action: A) => {

    // Reducer responds first
    let ret = next(action);

    // Then run proc with hooks
    proc(action, {
      dispatch,
      getState: createGetState(getState),
      putState: createPutState(dispatch, getState)
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
  maxIterations: 15,
  disableEffects: false,
  fingerprinting: true,
  idKey: "__id",
  originKey: "__origin",
  parentKey: "__parent",
  idFn
};

const enhancerFactory =
  <S>(proc: Proc<S>, conf: Config = {}): StoreEnhancer<S> =>
  (next: SimplifiedStoreCreator<S>) =>
  (reducer: Reducer<S>, ...args: any[]) => {
    let fullConf = { ...DEFAULT_CONFIG, ...conf };
    let debouncer = createDebouncer();
    let store = next(wrapReducer(reducer), ...args);
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