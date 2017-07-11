import { expect } from "chai";
import * as Sinon from "sinon";
import { createStore, combineReducers } from "redux";
import call from "./call";
import enhancerFactory from "./enhancer";
import wrap from "./wrap";

describe("Continuation actions", () => {
  it("can trigger multiple reducers within the same dispatch", () => {
    interface State {
      countA: number;
      countB: number;
      countC: number;
    }

    interface Action {
      type: "A"|"B"|"C";
      value: number;
    }

    /*
      Reducer for testing continuation actions. A calls B twice. And each B
      calls C twice. So B values should be 2x A, and C values should be 4x A.
    */
    const reducer = (state: State, action: Action) => {
      let { type, value } = action;
      switch (type) {
        case "A":
          return {
            state: { ...state, countA: state.countA + value },
            actions: [{ type: "B", value }, { type: "B", value }]
          };
        case "B":
          return {
            state: { ...state, countB: state.countB + value },
            actions: [{ type: "C", value }, { type: "C", value }]
          };
        case "C":
          return {
            state: { ...state, countC: state.countC + value }
          };
      }
      return { state };
    };

    const initState: State = {
      countA: 0,
      countB: 0,
      countC: 0
    };

    let store = createStore(
      wrap(reducer),
      initState,
      enhancerFactory()
    );

    store.dispatch({ type: "A", value: 1 });
    expect(store.getState()).to.deep.equal({
      countA: 1,
      countB: 2,
      countC: 4
    });
  });

  it("can pass instance information between different invocations of the " +
     "same reducer in the same loop",
  () => {
    interface Action {
      type: "COUNT";
      value: number;
    }

    // Count up to the given value, using instance to track progress
    const upReducer = wrap((
      state: number[]|undefined,
      action: Action,
      instance?: number
    ) => {
      state = state || [];
      if (action.type === "COUNT") {
        instance = typeof instance === "number" ? instance : 1;
        return {
          state: state.concat([instance]),
          actions: instance >= action.value ? [] : [action],
          instance: instance + 1
        };
      }
      return { state };
    });

    // Count down from the given value, using instance to track progress
    const downReducer = wrap((
      state: number[]|undefined,
      action: Action,
      instance?: number
    ) => {
      state = state || [];
      if (action.type === "COUNT") {
        instance = typeof instance === "number" ? instance : action.value;
        return {
          state: state.concat([instance]),
          instance: instance - 1
        };
      }
      return { state };
    });

    let store = createStore(combineReducers({
      up: upReducer,
      down: downReducer
    }), enhancerFactory());

    store.dispatch({ type: "COUNT", value: 3 });
    expect(store.getState()).to.deep.equal({
      up: [1, 2, 3],
      down: [3, 2, 1]
    });

    // Run again to check that instance resets
    store.dispatch({ type: "COUNT", value: 3 });
    expect(store.getState()).to.deep.equal({
      up: [1, 2, 3, 1, 2, 3],
      down: [3, 2, 1, 3, 2, 1]
    });
  });

  it("throws an error if it runs more than maxIteration loops", () => {
    let spy = Sinon.spy();
    let reducer = wrap((state: {}, action: { type: string }) => {
      state = state || {};
      if (action.type === "GO") {
        spy();
        return { state, actions: [action] };
      }
      return { state };
    });

    let store = createStore(reducer, enhancerFactory({
      maxIterations: 5
    }));
    expect(() => store.dispatch({ type: "GO" })).to.throw();
    expect(spy.callCount).to.equal(5);
  });
});

describe("Continuation effect", () => {
  it("gets executed after all actions processed", async () => {
    // Deferrals so we know when effects called
    let aSpy = Sinon.spy();
    let aResolve: (x: any) => any;
    let aPromise = new Promise((resolve) => aResolve = resolve);
    let bSpy = Sinon.spy();
    let bResolve: (x: any) => any;
    let bPromise = new Promise((resolve) => bResolve = resolve);

    type Action = { type: string; };
    const reducer = wrap((state = { a: false, b: false }, action: Action) => {
      switch (action.type) {
        case "A":
          return {
            state: { ...state, a: true },
            actions: [{ type: "B" }],
            effects: [
              call(aSpy),
              call(aResolve, action)
            ]
          };
        case "B":
          return {
            state: { ...state, b: true },
            effects: [
              call(bSpy),
              call(bResolve, action)
            ]
          };
      }
      return { state };
    });
    let store = createStore(reducer, enhancerFactory());

    /*
      Dispatch runs all actions synchronously, but doesn't call spies yet
      because call is async.
    */
    store.dispatch({ type: "A" });
    expect(store.getState()).to.deep.equal({ a: true, b: true });
    expect(aSpy.called).to.be.false;
    expect(bSpy.called).to.be.false;

    await Promise.all([aPromise, bPromise]);
    expect(aSpy.called).to.be.true;
    expect(bSpy.called).to.be.true;
  });

  it("can asynchronously dispatch more actions with origin tracking",
  async () => {
    // Create some deferrals to await async action terminating
    let aResolve: (x: any) => any;
    let aPromise = new Promise((resolve) => aResolve = resolve);
    let bResolve: (x: any) => any;
    let bPromise = new Promise((resolve) => bResolve = resolve);
    let cResolve: (x: any) => any;
    let cPromise = new Promise((resolve) => cResolve = resolve);

    const reducer = wrap((state = {}, action: { type: string }) => {
      switch (action.type) {
        case "A":
          return {
            state,
            effects: (dispatch) => [
              call(dispatch, { type: "B"}),
              call(aResolve, action)
            ]
          };
        case "B":
          return {
            state,
            effects: (dispatch) => [
              call(dispatch, { type: "C"}),
              call(bResolve, action)
            ]
          };
        case "C":
          return {
            state,
            effects: call(cResolve, action)
          };
      }
      return { state };
    });
    let store = createStore(reducer, enhancerFactory({
      metaKey: "meta",
      idKey: "id",
      originKey: "origin",
      idFn: (a) => a.type
    }));

    store.dispatch({ type: "A" });
    expect(await aPromise).to.deep.equal({
      type: "A",
      meta: {
        id: "A"
      }
    });
    expect(await bPromise).to.deep.equal({
      type: "B",
      meta: {
        id: "B",
        origin: "A"
      }
    });
    expect(await cPromise).to.deep.equal({
      type: "C",
      meta: {
        id: "C",
        origin: "B"
      }
    });
  });
});