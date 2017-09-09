import {
  Action, Dispatch, StoreEnhancer, Reducer, Store,
  Unsubscribe
} from 'redux';
import { DEFAULT_CONFIG, Config, FullConfig } from './config';
import { Debouncer } from './debouncer';
import { Domain } from './domains';
import { makeReduce } from './named-reducers';
import { merge, getMeta, setMeta } from './utils';

export type DomainMap<S, K extends keyof S> = {
  [X in K]: Domain<S[X], any>;
};

// Wrap reducer to handle putState actions -- putState runs first
export const wrapReducer = function<S, K extends keyof S>(
  reducer: Reducer<S>,
  domains: DomainMap<S, K>,
  conf: FullConfig
) {
  return <A extends Action>(state: S, action: A) => {
    let initLoad = !state;

    // Important to run original reducer first so as to set initial state
    // provided by that reducer if necessary.
    state = reducer(state, action) || {};

    // Create copy of state object so we can safely mutate it. Note that
    // we're implicitly assumign that state is just a normal object and
    // not an array or something here.
    state = merge(state);

    // Initial load -- populate with initial state unless wrapped reducer
    // did that already.
    if (initLoad) {
      for (let domainName in domains) {
        let current = state[domainName];
        state[domainName] = current === void 0 ?
          domains[domainName].initState : current;
      }
    }

    // If this is a targeted dispatch action, call the named reducer.
    let keys: [string, string]|undefined = getMeta(
      action,
      conf.targetedDispatchKey
    );
    if (keys) {
      let domainName = keys[0] as keyof S;
      let reducerName = keys[1];
      let domain = domains[domainName];
      if (! domain) {
        throw new Error(`'${domainName}' domain not found`);
      }
      state[domainName] = domain.reduce(
        state[domainName],
        reducerName,
        (action as any).payload
      );
    }

    return state;
  };
};

// Wrap dispatch to call domain handlers, fingerprint actions
export const wrapDispatchNoFlush = function<S, K extends keyof S>(
  next: Dispatch<S>,
  domains: DomainMap<S, K>,
  conf: FullConfig
) {
  const dispatch = <A extends Action>(action: A, skipHandlers = false) => {

    /*
      Reference dispatch that we will pass to handlers. This gets modified
      by fingerprint if applicable.
    */
    let wrappedDispatch = dispatch;

    // Modify action and dispatch to fingerprint for subsequent dispatches
    if (conf.fingerprinting) {
      let id = conf.idFn(action);
      action = setMeta(action, conf.idKey, id);

      // Set parent and origin for re-dispatch
      wrappedDispatch = (action: A, skipHandlers = false) => {
        action = setMeta(action, conf.parentKey, id);
        if (! getMeta(action, conf.originKey)) {
          action = setMeta(action, conf.originKey, id);
        }
        return dispatch(action, skipHandlers);
      };
    }

    // Reducer responds before domain code
    let ret = next(action);

    // Then run domain handlers
    if (! skipHandlers) {
      for (let key in domains) {
        domains[key].handle(action);
      }
    }

    return ret;
  };

  return dispatch;
};

// Wrap dispatch with debouncer flush (so non-Yatorse dispatches get
// processed synchronously)
export const wrapDispatchAndFlush =
  <S>(next: Dispatch<S>, debouncer: Debouncer) =>
  <A extends Action>(action: A) => {
    let ret = next(action);
    debouncer.flush();
    return ret;
  };

// Wrap subscribe functionality to implement debounce
export const wrapSubscribe =
  (subscribe: Store<any>['subscribe'], debouncer: Debouncer) =>
  (listener: () => void): Unsubscribe =>
  subscribe(debouncer.debounce(listener));


// Simplified type since we only care about reducer here
export interface SimplifiedStoreCreator<S> {
  (reducer: Reducer<S>, ...args: any[]): Store<S>;
}

const createEnhancer = function<S, K extends keyof S>(
  domains: DomainMap<S, K>,
  conf: Config = {}
): StoreEnhancer<S> {
  let fullConf = { ...DEFAULT_CONFIG, ...conf };
  return (
    (next: SimplifiedStoreCreator<S>) =>
    (reducer: Reducer<S>, ...args: any[]) => {
      // Wrap reducer + dispatch to reference domains
      let store = next(wrapReducer(reducer, domains, fullConf), ...args);
      let dispatchNoFlush = wrapDispatchNoFlush(
        store.dispatch,
        domains,
        fullConf
      );

      // Connect domains w/ reference to wrapped dispatcher
      for (let domainName in domains) {
        let domain = domains[domainName as K];
        domain.connect({
          getState: () => store.getState()[domainName],
          dispatch: dispatchNoFlush,
          reduce: makeReduce(domainName, dispatchNoFlush, fullConf)
        });
      }

      // Wrap again to handle debouncer -- note that we auto-flush after
      // each dispatch triggered by directly calling dispatch on store,
      // but *not* when calling from within a domain handler.
      let debouncer = new Debouncer();
      let dispatch = wrapDispatchAndFlush(dispatchNoFlush, debouncer);
      let subscribe = wrapSubscribe(store.subscribe, debouncer);

      return {
        ...store,
        dispatch,
        subscribe
      };
    }
  );
};

export default createEnhancer;