/*
  Modify actions with fingerprint IDs
*/

import { Action } from "redux";
import { FullConfig } from "./types";

/*
  Helper function that returns either the meta key under an action
  (if applicable) or the action itself.
*/
export const getMeta = (action: Action, conf: FullConfig): any => {
  if (conf.metaKey) {
    return (action as any)[conf.metaKey] || {};
  }
  return action;
};

/*
  Helper function sets a key under the meta object of the action (creating
  one if necessary) or under the action itself
*/
export const setMeta = <A extends Action>(
  action: A,
  changes: { [index: string]: any },
  conf: FullConfig
): A => {
  if (conf.metaKey) {
    changes = {
      [conf.metaKey]: {
        ...getMeta(action, conf),
        ...changes
      }
    };
  }
  return {
    ...(action as any), // Ignore spread-types / object-types type issue
    ...changes
  };
};
