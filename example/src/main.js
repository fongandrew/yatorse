import "babel-polyfill";
import { AppContainer } from "react-hot-loader";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import store from "./store";
import App from "./components/App";
import { init as initRouting } from "./states/routes";

initRouting(location, store.dispatch);

const rootEl = document.getElementById("root");
const render = Component => {
  ReactDOM.render(
    <AppContainer>
      <Provider store={store}>
        <Component />
      </Provider>
    </AppContainer>,
    rootEl
  );
}

render(App);

if (module.hot) module.hot.accept("./components/App", () => render(App));

