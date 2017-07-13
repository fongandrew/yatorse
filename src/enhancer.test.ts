import { expect } from "chai";
import * as Sinon from "sinon";
import { createStore } from "redux";
import { call } from "./effects";
import enhancerFactory from "./enhancer";
import { dispatch } from "./placeholders";
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
            effects: [
              call(dispatch, { type: "B"}),
              call(aResolve, action)
            ]
          };
        case "B":
          return {
            state,
            effects: [
              call(dispatch, { type: "C"}),
              call(bResolve, action)
            ]
          };
        case "C":
          return {
            state,
            effects: [
              call(cResolve, action)
            ]
          };
      }
      return { state };
    });
    let store = createStore(reducer, enhancerFactory({
      idKey: "id",
      originKey: "origin",
      parentKey: "parent",
      idFn: (a) => a.type
    }));

    store.dispatch({ type: "A" });
    expect(await aPromise).to.deep.equal({
      type: "A",
      id: "A",
      origin: "A"
    });
    expect(await bPromise).to.deep.equal({
      type: "B",
      id: "B",
      origin: "A",
      parent: "A"
    });
    expect(await cPromise).to.deep.equal({
      type: "C",
      id: "C",
      origin: "A",
      parent: "B"
    });
  });

  it("can be run with fingerprint vars under a metaKey", async () => {
    // Create some deferrals to await async action terminating
    let aResolve: (x: any) => any;
    let aPromise = new Promise((resolve) => aResolve = resolve);
    let bResolve: (x: any) => any;
    let bPromise = new Promise((resolve) => bResolve = resolve);

    const reducer = wrap((state = {}, action: { type: string }) => {
      switch (action.type) {
        case "A":
          return {
            state,
            effects: [
              call(dispatch, { type: "B"}),
              call(aResolve, action)
            ]
          };
        case "B":
          return {
            state,
            effects: [
              call(dispatch, { type: "C"}),
              call(bResolve, action)
            ]
          };
      }
      return { state };
    });
    let store = createStore(reducer, enhancerFactory({
      idKey: "id",
      metaKey: "meta",
      originKey: "origin",
      parentKey: "parent",
      idFn: (a) => a.type
    }));

    store.dispatch({ type: "A" });
    expect(await aPromise).to.deep.equal({
      type: "A",
      meta: {
        id: "A",
        origin: "A"
      }
    });
    expect(await bPromise).to.deep.equal({
      type: "B",
      meta: {
        id: "B",
        origin: "A",
        parent: "A"
      }
    });
  });

  it("can be run without fingerprinting", async () => {
    // Create some deferrals to await async action terminating
    let aResolve: (x: any) => any;
    let aPromise = new Promise((resolve) => aResolve = resolve);
    let bResolve: (x: any) => any;
    let bPromise = new Promise((resolve) => bResolve = resolve);

    const reducer = wrap((state = {}, action: { type: string }) => {
      switch (action.type) {
        case "A":
          return {
            state,
            effects: [
              call(dispatch, { type: "B"}),
              call(aResolve, action)
            ]
          };
        case "B":
          return {
            state,
            effects: [
              call(dispatch, { type: "C"}),
              call(bResolve, action)
            ]
          };
      }
      return { state };
    });
    let store = createStore(reducer, enhancerFactory({
      fingerprinting: false
    }));

    store.dispatch({ type: "A" });
    expect(await aPromise).to.deep.equal({
      type: "A",
    });
    expect(await bPromise).to.deep.equal({
      type: "B",
    });
  });
});