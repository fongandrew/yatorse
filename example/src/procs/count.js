

// Interval object created by setInterval
let interval;

const COUNT_KEY = "count";
const COUNT_KEY_2 = "count2";
const countPutter = (putState) => (fn) => putState(COUNT_KEY, fn);
const countPutter2 = (putState) => (fn) => putState(COUNT_KEY_2, fn);
export const count = (action, { putState, dispatch }) => {
  switch (action.type) {
    case "START":
      clearInterval(interval);
      interval = setInterval(
        () => dispatch({ type: "COUNT" }),
        action.payload
      );
      break;

    case "COUNT":
      let putCount = countPutter(putState);
      putCount((s = 0) => s + 1);
      let putCount2 = countPutter2(putState);
      putCount2((s = 0) => s + 2);
      break;

    case "STOP":
      clearInterval(interval);
      break;
  }
};

export default count;