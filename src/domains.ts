/*
  Domain creation logic
*/

import { Action } from 'redux';
import {
  NamedReducer,
  TargetedDispatch,
  isTargetedDispatch
} from './named-reducers';

// Base interface options available for handler interface definition
export interface BaseInterface<S> {

  // Return state for this domain
  getState: () => S;

  // Dispatch an action to store (goes to all reducers and, unless explictily
  // skipped, to handlers on this and other domains as well)
  dispatch: <A extends Action>(action: A, skipHandlers?: boolean) => A;

  // Created a targeted dispatch function for a given reducer
  reduce: <P>(r: NamedReducer<S, P>) => TargetedDispatch<S, P>;
}

/*
  Function to handle a given action for some domain.
  Handler should return a promise if asynchronous.
*/
export interface Handler<A extends Action, I> {
  (action: A, ifc: I): Promise<void>|void;
}

export class Domain<
  S,  // State controlled by this domain
  I   // Interface for handlers to interact with
> {
  handlerIfc: I|null = null;
  handlers: Handler<Action, I>[] = [];

  constructor(
    // Initial state
    public initState: S,

    // Handler interface definition function
    protected handlerDefn: (base: BaseInterface<S>) => I
  ) {}

  // Used by enhancer to create hooks
  connect(base: BaseInterface<S>) {
    this.handlerIfc = this.handlerDefn(base);

    // Assign names to targeted dispatch
    for (let key in this.handlerIfc) {
      let val = this.handlerIfc[key];
      if (isTargetedDispatch(val)) {
        val._setTargetedDispatchName(key);
      }
    }
  }

  // Called by enhancer when action dispatched
  handle(action: Action) {
    if (! this.handlerIfc) {
      throw new Error('Domain not connected to store.');
    }
    let ifc = this.handlerIfc;
    return Promise.all(this.handlers.map(h => h(action, ifc)));
  }

  // Called by enhanced reducer to handle named reducer calls.
  reduce(state: S, name: string, payload: any): S {
    if (! this.handlerIfc) {
      throw new Error('Domain not connected to store.');
    }

    let val = this.handlerIfc[name as keyof I];
    if (! isTargetedDispatch(val)) {
      throw new Error(`'${name}' is not a reducer name`);
    }

    return val._reducer(state, payload);
  }

  /*
    Add callback to handlers list.

    TODO: Can improve performance by keying Handlers by action type instead
    of checking each handler individually. It probably doesn't matter in
    most cases though.
  */
  on<A extends Action>(type: A['type'], cb: Handler<A, I>): this;
  on<A extends Action>(
    test: (action: Action) => boolean,
    cb: Handler<A, I>
  ): this;
  on<A extends Action>(
    pre: string|((action: Action) => boolean),
    cb: Handler<A, I>
  ) {
    const test = typeof pre === 'string' ?
      (a: Action) => a.type === pre : pre;
    const handler: Handler<A, I> = (action, ifc) => {
      if (test(action)) {
        return cb(action, ifc);
      }
    };
    this.handlers.push(handler);
    return this;
  }
}
