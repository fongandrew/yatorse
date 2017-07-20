/*
  Helper function to With next frame across different environments.
*/
export const nextTick = (fn: Function) => {
  if (typeof setImmediate !== "undefined") {
    setImmediate(fn);
  }
  else if (typeof requestAnimationFrame !== "undefined") {
    requestAnimationFrame(() => fn());
  }
  else if (typeof process !== "undefined" && process.nextTick) {
    process.nextTick(fn);
  }
  else {
    setTimeout(fn, 0);
  }
};

declare var process: any; // For process.nextTick call above
