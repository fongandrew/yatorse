/*
  Enhancer options
*/

import { Action } from 'redux';
import { idFn } from './utils';

// Configuration for enhancer
export interface FullConfig {
  /*
    Effects may include dispatching other actions in the future. To help
    track things, we fingerprint each action with an ID by default (which
    can get picked up by Redux's dev tools) and the actions's parent (the last
    action responsible for dispatching this one) and the action's origin (the
    original non-side-effect-dispatch that triggered our action chain).

      * Set fingerprint=false to disable fingerprinting.
      * idKey - Key for the fingerprint for this action. Use "." to group
        this key under another object in the action (e.g. if you use
        Flux Standard Actions, specifying "meta.id" will merge
        `{ meta: { id: string }}` with your action.
      * parentKey - Key for parent's ID. Same rules as idKey.
      * originKey - Key for origin's ID. Same rules as isKey.
  */
  fingerprinting: boolean;
  idKey: string;
  parentKey: string;
  originKey: string;

  /*
    Custom function for fingerprint generation
  */
  idFn: (action: Action) => string;

  /*
    Property used to denote this is a targeted dispatch action.
    Follows same rules as idKey.
  */
  targetedDispatchKey: string;

  /*
    Default type for an effect action. Type has no actual impact on how
    effects are reduced (that's what the effectActionKey above is for) and is
    primarily for informative purposes. That said, if there are other reducers
    targeting this type, they will be triggered.
  */
  targetedDispatchType:
    string|
    ((domainName: string, reducerName: string, payload: any) => string);
}

// Opt object actually passed to enhancer
export type Config = Partial<FullConfig>;

// Default config options
export const DEFAULT_CONFIG: FullConfig = {
  fingerprinting: true,
  idKey: 'meta.id',
  originKey: 'meta.origin',
  parentKey: 'meta.parent',
  idFn,
  targetedDispatchKey: 'meta.isTargetedDispatch',
  targetedDispatchType: (domain, reducer) => `${domain}/${reducer}`
};
