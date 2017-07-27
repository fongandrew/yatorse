import { combineReducers, compose, createStore } from "redux";
import yatorse from "yatorse";
import count from "./procs/count";

// Noop reducer
const reducer = (state = {}) => state;

// Proc calls sub-procs
const proc = (async (action, hooks) => {
  await Promise.all([
    count(action, hooks)
  ]);

  /*
    Log that proc has ended -- dispatches trigger this function again, so
    check action type to avoid infinite recursion.
  */
  // if (!action.type.endsWith("/END") && !action.type.endsWith("/PUT")) {
  //   hooks.dispatch({
  //     type: action.type + "/END"
  //   });
  // }
});

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
export default createStore(reducer, composeEnhancers(
  yatorse(proc)
));