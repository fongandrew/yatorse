import { call, wrap } from "yatorse";

const INIT_STATE = {
  count: 0,
  counting: false
};

/*
  Counter logic. Expects action of the following form:

    { type: "START", payload: number }
    { type: "INCR", payload: number }
    { type: "STOP" }
*/
const count = wrap((state = INIT_STATE, action, dispatch) => {
  switch (action.type) {
    /*
      START action: If we're already counting, do nothing. Else, dispatch
      an INCR action (which will start a loop that goes until END is called).
    */
    case "START":
      return state.counting ? { state } : {
        state: {
          ...state,
          counting: true
        },
        actions: [{
          type: "INCR",
          payload: action.payload
        }],
      };

    /*
      INCR action: Increment count by payload if not already stopped.
    */
    case "INCR":
      return state.counting ? {
        state: {
          ...state,
          count: state.count + action.payload
        },
        effects: [
          call(countAfterDelay,
            dispatch,
            { type: "INCR", payload: action.payload },
            1000
          )
        ]
      } : { state };

    case "STOP":
      return {
        state: {
          ...state,
          counting: false
        }
      };
  }
  return { state };
});

// Effect function delay counting
let countAfterDelay = (dispatch, action, delay) => setTimeout(
  () => dispatch(action), delay
);

export default count;