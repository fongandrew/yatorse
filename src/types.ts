/*
  Shared types
*/
import { Action, Dispatch } from "redux";

export interface PutAction {
  type: string;
  payload: {
    keys?: string[];
    data: any;
  };
}

/*
  A debouncer is used to debounce multiple signals occurring within the same
  synchronous loop.
*/
export interface Debouncer {
  /*
    Wrap function whose calls are to be debounced
  */
  debounce: (fn: () => void) => () => void;

  /*
    Flush allows for manually triggering any callbacks without waiting for
    callbacks to occur on next tick. Functions wrapped by debounce are called
    only if they received any previous calls in the last tick.
  */
  flush: () => void;
}

/*
  getState and putState typing allow for specification of multiple nested
  keys.
*/
export interface GetStateFn<S> {
  (): S;
  <K1 extends keyof S>(k1: K1): S[K1];
  <K1 extends keyof S, K2 extends keyof S[K1]>(k1: K1, k2: K2): S[K1][K2];
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2]>(
    k1: K1, k2: K2, k3: K3
  ): S[K1][K2][K3];
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2],
   K4 extends keyof S[K1][K2][K3]>(
    k1: K1, k2: K2, k3: K3, k4: K4
  ): S[K1][K2][K3][K4];
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2],
   K4 extends keyof S[K1][K2][K3], K5 extends keyof S[K1][K2][K3][K4]>(
    k1: K1, k2: K2, k3: K3, k4: K4, k5: K5
  ): S[K1][K2][K3][K4][K5];
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2],
   K4 extends keyof S[K1][K2][K3], K5 extends keyof S[K1][K2][K3][K4],
   K6 extends keyof S[K1][K2][K3][K4][K5]>(
    k1: K1, k2: K2, k3: K3, k4: K4, k5: K5, k6: K6
  ): S[K1][K2][K3][K4][K5][K6];
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2],
   K4 extends keyof S[K1][K2][K3], K5 extends keyof S[K1][K2][K3][K4],
   K6 extends keyof S[K1][K2][K3][K4][K5]>(
    k1: K1, k2: K2, k3: K3, k4: K4, k5: K5, k6: K6, ...rest: any[]
  ): any;
}

export type StateFn<S> = (state: S) => S;
export interface PutStateFn<S> {
  (fn: StateFn<S>): void;
  <K1 extends keyof S>(k1: K1, fn: StateFn<S[K1]>): void;
  <K1 extends keyof S, K2 extends keyof S[K1]>(
    k1: K1, k2: K2, fn: StateFn<S[K1][K2]>
  ): void;
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2]>(
    k1: K1, k2: K2, k3: K3, fn: StateFn<S[K1][K2][K3]>
  ): void;
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2],
   K4 extends keyof S[K1][K2][K3]>(
    k1: K1, k2: K2, k3: K3, k4: K4, fn: StateFn<S[K1][K2][K3][K4]>
  ): void;
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2],
   K4 extends keyof S[K1][K2][K3], K5 extends keyof S[K1][K2][K3][K4]>(
    k1: K1, k2: K2, k3: K3, k4: K4, k5: K5, fn: StateFn<S[K1][K2][K3][K4][K5]>
  ): void;
  <K1 extends keyof S, K2 extends keyof S[K1], K3 extends keyof S[K1][K2],
   K4 extends keyof S[K1][K2][K3], K5 extends keyof S[K1][K2][K3][K4],
   K6 extends keyof S[K1][K2][K3][K4][K5]>(
    k1: K1, k2: K2, k3: K3, k4: K4, k5: K5, k6: K6,
    fn: StateFn<S[K1][K2][K3][K4][K5][K6]>
  ): void;
}

/*
  Use action matcher to create one-off promises that get resolved when
  a particular action is dispatched that matches a test.
*/
export interface ActionMatcher {
  // Run all registered tests.
  dispatch: Dispatch<any>;

  // Same as onNext in the Hooks interface
  register: <A extends Action>(
    test: (A["type"] & string)|((action: Action) => boolean)
  ) => Promise<A>;
}

/*
  Functions available to Proc for interacting with Redux store
*/
export interface Hooks<S> {

  // Retrieve state by key(s)
  getState: GetStateFn<S>;

  // Update state by key(s)
  putState: PutStateFn<S>;

  // Dispatch a new action -- optional bool to skip proc for this dispatch
  dispatch: <A extends Action>(action: A, skipProc?: boolean) => A;

  /*
    Return promise that resolves when an action matching the test has been
    dispatched. The test should either be a string (which matches the action
    type) or a function that takes an action and returns a bool.

    If the action is dispatched with skipProc = true, then this promise will
    not trigger.
  */
  onNext: <A extends Action>(
    test: (A["type"] & string)|((action: Action) => boolean)
  ) => Promise<A>;
}

/*
  Type for function that handles and dispatches additional actions
*/
export interface Proc<S> {
  (action: Action, hooks: Hooks<S>): Promise<void>|void;
}

/*
  Config options for determining how to group together putActions
*/
export interface PutActionConfig {
  type: string|((action: Action) => string);
  test: (type: string) => boolean;
}

// Configuration for enhancer
export interface FullConfig {
  /*
    Effects may include dispatching other actions in the future. To help
    track things, we fingerprint each action with an ID by default (which
    can get picked up by Redux's dev tools) and the actions's parent (the last
    action responsible for dispatching this one) and the action's origin (the
    original non-side-effect-dispatch that triggered our action chain).

      * Set fingerprint=false to disable fingerprinting.
      * metaKey - If set, all of the fingerprinting properties are grouped
        under a "meta" key (a la Flux Standard Actions).
      * idKey - Key for the fingerprint for this action
      * parentKey - Key for parent's ID
      * originKey - Key for origin's ID
  */
  fingerprinting: boolean;
  metaKey?: string;
  idKey: string;
  parentKey: string;
  originKey: string;

  /*
    Custom function for fingerprint generation
  */
  idFn: (action: Action) => string;

  /*
    Group put action conf under one key because setting type and determing
    whether type is for a put action go together.
  */
  putActionConf: PutActionConfig;
}

// Opt object actually passed to enhancer
export type Config = Partial<FullConfig>;