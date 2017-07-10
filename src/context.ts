/*
  In order to retain compatbility with standard Redux state reducers, we use
  a global context object to pass effects and continuation actions around.
*/
import { ContextType } from "./types";

// Actual context object
const Context: ContextType = {
  iteration: 0,
  actions: []
};

export default Context;