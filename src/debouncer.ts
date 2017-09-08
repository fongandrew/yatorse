/*
  Debouncer is used to debounce multiple calls to a given function.
  Calls are deferrered until end of a given tick, in which case the function
  is called only once. Allows for manually flushing any pending calls
  synchronously as well.
*/
export class Debouncer {
  protected callbacks: Array<() => void> = [];

  /*
    Wrap function whose calls are to be debounced
  */
  debounce(fn: () => void): () => void {
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
    this.callbacks.push(run);

    // Wrapped function guarantees at least one run
    return () => {
      if (! pending) {
        pending = true;
        Promise.resolve().then(run);
      }
    };
  }

  /*
    Flush allows for manually triggering any callbacks without waiting for
    callbacks to occur on next tick. Functions wrapped by debounce are called
    only if they received any previous calls in the last tick.
  */
  flush(): void {
    /*
      Capture number of callbacks at this time, since possible for callbacks
      to push other callbacks. Flushing should only trigger callbacks
      in existence at time flush started.
    */
    let numCallbacks = this.callbacks.length;
    for (let i = 0; i < numCallbacks; i++) {
      this.callbacks[i]();
    }
  }
}
