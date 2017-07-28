/*
  Watch for an action. Trigger promise when called.
*/

import { Action } from "redux";
import { ActionMatcher } from "./types";

export const createActionMatcher = (): ActionMatcher => {
  let matchers: {
    test: (a: Action) => boolean;
    resolve: (a: Action) => void;
  }[] = [];

  const dispatch = <A extends Action>(action: A) => {
    // Collect every matcher that fails test for later
    let newMatchers: typeof matchers = [];

    for (let i in matchers) {
      let matcher = matchers[i];
      if (matcher.test(action)) {
        matcher.resolve(action);
      } else {
        newMatchers.push(matcher);
      }
    }

    matchers = newMatchers;
    return action;
  };

  const register = <A extends Action>(
    testArg: string|((a: Action) => boolean)
  ) => {
    // Normalize string test to function
    let test = typeof testArg === "string" ?
      (a: Action) => a.type === testArg : testArg;

    // Create a deferred object can associate it with test
    let resolve: (a: A) => void;
    let promise = new Promise<A>((r) => resolve = r);
    matchers.push({
      test,
      resolve: resolve!
    });

    return promise;
  };

  return { dispatch, register };
};