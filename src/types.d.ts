/*
  Shared types
*/
import { Action, Dispatch, Reducer } from "redux";

/*
  For declarative representation of function calls -- identical to how
  redux-saga does this.
*/

export interface Effect {
  context: any;
  fn: Function;
  args: any[];
}

export type EffectFn<F extends Function> =
  F | [any, F] | {context: any, fn: F};

export type EffectNamedFn<C extends {[P in Name]: Function},
                              Name extends string> =
  [C, Name] | {context: C, fn: Name};


/*
  Types for enhanced reducers.
*/

// Effects extracted while recalling
export interface Update<S> {
  state: S;
  effects: Effect[];
}

// Effects + actions extracted while recalling
export interface Continuation<S> extends Update<S> {
  actions: Action[];
}

export type Loop<S> = (
  state: S,
  action: Action,
  dispatch: Dispatch<S>
) => Partial<Continuation<S>>;


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
  disableEffects: boolean;

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