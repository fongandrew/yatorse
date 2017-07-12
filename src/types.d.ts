/*
  Shared types
*/
import { Action, Dispatch, Reducer } from "redux";

/*
  For declarative representation of function calls -- identical to how
  redux-saga does this.
*/

export interface CallEffect {
  context: any;
  fn: Function;
  args: any[];
}

export type CallEffectFn<F extends Function> =
  F | [any, F] | {context: any, fn: F};

export type CallEffectNamedFn<C extends {[P in Name]: Function},
                              Name extends string> =
  [C, Name] | {context: C, fn: Name};


/*
  Types for enhanced reducers.
*/

export type EffectsFn = <S>(
  dispatch: Dispatch<S>
) => void|CallEffect|CallEffect[];

export interface Continuation<S> {
  // New state, same return value as normal Redux reducer
  state: S;

  // Follow-on action(s) triggered by this action
  actions?: Action|Action[];

  // Effect functions to call after all actions have been reduced
  effects?: EffectsFn|CallEffect|CallEffect[];
}

export type Loop<S> = (
  state: S, action: Action, count: number
) => Continuation<S>;


/*
  Type for a global context object we use track effects and continuation
  actions.
*/
export interface ContextType {
  /*
    Track how many action reductions have run. Main purpose is help reducers
    track if they've alrady been run during a given reduction.
  */
  iteration: number;

  /*
    Track continuation actions
  */
  actions: Action[];

  /*
    Track how many effects have been returned by enhanced reducers so far.
    Set to undefined to indicate that effects should not be tracked (i.e.
    if we're replaying action log using Redux dev tools)
  */
  effects?: (EffectsFn|CallEffect)[];
}


// Configuration for enhancer
export interface FullConfig {
  /*
    Maximum loop iterations we permit for an action to trigger another
    round of actions. Safety check for infinite loops and possible bad ideas.
  */
  maxIterations: number;

  /*
    Disable side effects running during dispatch. May want to do this when
    testing or in some other context where running effect code isn't desired.
  */
  disableSideEffects: boolean;

  /*
    Effects may include dispatching other actions in the future. To help
    track things, we fingerprint each action with an ID by default (which
    can get picked by Redux's dev tools) and the actions's parent (the last
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
}

// Opt object actually passed to enhancer
export type Config = Partial<FullConfig>;