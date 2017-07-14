import { combineReducers, compose, createStore } from "redux";
import yatorse from "yatorse";
import count from "./reducers/count"

const reducer = combineReducers({ count });
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default createStore(reducer, composeEnhancers(
  yatorse()
));