/*
  Which view should we show?
*/

/*
  State key + selector, refactored here for use in containers.
  Note that state is last param in curried form for composability with
  libraries like reselect.
*/
const routeKey = "route";
export const selectRoute = (state) => state[routeKey];

// Proc for updating state on dispatch
export const routeChange = (action, { putState }) => {
  if (action.type === "ROUTE") {
    let hash = action.payload;
    if (hash[0] === "#") {
      hash = hash.slice(1);
    }
    putState(routeKey, () => hash);
  }
};

// Hook up hash change handler to dispatch
export const init = (location, dispatch) => {
  const hashChange = () => dispatch({
    type: "ROUTE",
    payload: location.hash
  });
  window.onhashchange = hashChange;
  hashChange(); // Initial dispatch
};