

const COUNT_KEY = "count";
const COUNT_KEY_2 = "count2";
const countPutter = (putState) => (fn) => putState(COUNT_KEY, fn);
const countPutter2 = (putState) => (fn) => putState(COUNT_KEY_2, fn);
export const count = async (action, { putState, onNext }) => {
  if (action.type === "START") {
    let putCount = countPutter(putState);
    let putCount2 = countPutter2(putState);
    let interval = setInterval(() => {
      putCount((s = 0) => s + 1);
      putCount2((s = 0) => s + 2);
    }, action.payload);

    await onNext("STOP");
    clearInterval(interval);
  }
};

export default count;