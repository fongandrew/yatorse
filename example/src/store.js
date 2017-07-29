import { combineReducers, compose, createStore } from "redux";
import yatorse from "yatorse";
import { cycleHN } from "./states/hn";

// Noop reducer
const reducer = (state = {}) => state;

// Proc calls sub-procs
const proc = (action, hooks) => {
  cycleHN(action, hooks);
};

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
export default createStore(reducer, composeEnhancers(
  yatorse(proc)
));