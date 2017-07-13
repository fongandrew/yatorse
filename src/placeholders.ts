/*
  Placeholder functions with implementations that got replaced by other
  functions. Exist so that we can declaratively represent an effect that calls
  a function that isn't available in the current scope.

  For type-checking to work, placeholders should have the same type as the
  target function.
*/

import { Dispatch } from "redux";
import Context from "./context";

// Dispatch function for the current context
export const dispatch: Dispatch<any> = (a) => {
  if (! Context.dispatch) {
    throw new Error(
      "Dispatch should not be called at this point in time. This is a " +
      "placeholder function that gets replaced by the real dispatch function."
    );
  }
  return Context.dispatch(a);
};

