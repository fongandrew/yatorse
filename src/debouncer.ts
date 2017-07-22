import { Debouncer } from "./types";

/*
  Debouncer is used to debounce multiple calls to a given function.
  Calls are deferrered until end of a given tick, in which case the function
  is called only once. Allows for manually flushing any pending calls
  synchronously as well.
*/
export const createDebouncer = (): Debouncer => {
  let callbacks: Array<() => void> = [];
  return {
    debounce: (fn) => {
      // Track if any pending calls to this function
      let pending = false;

      /*
        Create callback to call wrapped function -- triggered either by
        nextTick or flush. Only run function if still pending.
      */
      let run = () => {
        if (pending) {
          pending = false; // This comes first. In case wrapped fn errors.
          fn();
        }
      };
      callbacks.push(run);

      // Wrapped function guarantees at least one run
      return () => {
        if (! pending) {
          pending = true;
          Promise.resolve().then(run);
        }
      };
    },

    flush: () => {
      /*
        Capture number of callbacks at this time, since possible for callbacks
        to push other callbacks. Flushing should only trigger callbacks
        in existence at time flush started.
      */
      let numCallbacks = callbacks.length;
      for (let i = 0; i < numCallbacks; i++) {
        callbacks[i]();
      }
    }
  };
};

export default createDebouncer;