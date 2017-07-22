import { expect } from "chai";
import * as Sinon from "sinon";
import { createStore, Action, Reducer } from "redux";
import enhancerFactory from "./enhancer";

// Do-nothing reducer for proc testing
const noopReducer: Reducer<any> = (state = {}, action) => state;

describe("Enhancer with proc function", () => {
  it("does not interrupt normal Redux reducer flow", () => {
    interface State {
      count: number;
    }

    let reducer = <A extends Action>(state = { count: 0 }, action: A) => {
      if (action.type === "INCR") {
        return { ...state, count: state.count + 1 };
      }
      return state;
    };

    let spy1 = Sinon.spy();
    let spy2 = Sinon.spy();
    let enhancer = enhancerFactory<State>((action) => spy1(action));
    let store = createStore<State>(reducer, enhancer);
    store.subscribe(spy2);
    store.dispatch({ type: "INCR" });

    Sinon.assert.calledWith(spy1, { type: "INCR" });
    expect(store.getState()).to.deep.equal({ count: 1 });
    Sinon.assert.calledOnce(spy2);
  });

  it("can get state", () => {
    interface State {
      count: number;
    }

    let reducer = <A extends Action>(state = { count: 0 }, action: A) => {
      if (action.type === "INCR") {
        return { ...state, count: state.count + 1 };
      }
      return state;
    };

    let spy = Sinon.spy();
    let enhancer = enhancerFactory<State>((action, { getState }) => {
      spy(getState("count"));
    });
    let store = createStore<State>(reducer, enhancer);
    store.dispatch({ type: "INCR" });

    Sinon.assert.calledWith(spy, 1);
  });

  it("can put state", () => {
    interface State {
      count: number;
    }

    let spy1 = Sinon.spy();
    let spy2 = Sinon.spy();
    let enhancer = enhancerFactory<State>((action, { getState, putState }) => {
      if (action.type === "INCR") {
        putState("count", (n = 0) => n + 1);
      }
      spy1(getState("count"));
    });
    let store = createStore<State>(noopReducer, enhancer);
    store.subscribe(spy2);

    store.dispatch({ type: "INCR" });
    Sinon.assert.calledWith(spy1, 1);
    Sinon.assert.calledOnce(spy2);

    store.dispatch({ type: "INCR" });
    Sinon.assert.calledWith(spy1, 2);
    Sinon.assert.calledTwice(spy2);

    expect(store.getState()).to.deep.equal({ count: 2 });
  });

  it("can put state asynchronously", async () => {
    interface State {
      count: number;
    }

    let spy = Sinon.spy();
    let enhancer = enhancerFactory<State>(async (action, { putState }) => {
      if (action.type === "INCR") {
        await Promise.resolve();
        putState("count", (n = 0) => n + 1);
        putState("count", (n = 0) => n + 1);

        await Promise.resolve();
        putState("count", (n = 0) => n + 1);
      }
    });
    let store = createStore<State>(noopReducer, enhancer);
    store.subscribe(spy);

    // Synchronous => immediate subscription update
    store.dispatch({ type: "INCR" });
    expect(store.getState()).to.deep.equal({});
    Sinon.assert.calledOnce(spy);

    // Async => Take a tick for async sub listeners to fire (necessary for
    // debounce to work properly)
    await Promise.resolve();
    expect(store.getState()).to.deep.equal({ count: 2 });

    await Promise.resolve();
    Sinon.assert.calledTwice(spy);
    expect(store.getState()).to.deep.equal({ count: 3 });

    await Promise.resolve();
    Sinon.assert.calledThrice(spy);

    // Wait another tick and check again that only called once per async
    await Promise.resolve();
    Sinon.assert.calledThrice(spy);
  });

  it("can dispatch other actions", async () => {
    interface State {
      a: number;
      b: number;
      c: number;
    }

    const initState: State = { a: 0, b: 0, c: 0 };
    let reducer = <A extends Action>(state = initState, action: A) => {
      switch (action.type) {
        case "A":
          return { ...state, a: state.a + 1 };
        case "B":
          return { ...state, b: state.b + 1 };
        case "C":
          return { ...state, c: state.c + 1 };
      }
      return state;
    };

    let enhancer = enhancerFactory<State>((action, { dispatch }) => {
      switch(action.type) {
        case "A":
          dispatch({ type: "B" });
          break;
        case "B":
          dispatch({ type: "C" });
          break;
      }
    });
    let store = createStore<State>(reducer, enhancer);
    let spy = Sinon.spy();
    store.subscribe(spy);
    store.dispatch({ type: "A" });

    // A triggers B which triggers C, all synchronously here.
    expect(store.getState()).to.deep.equal({ a: 1, b: 1, c: 1 });
    Sinon.assert.calledOnce(spy);

    // Make sure no additional subscription triggers on next tick
    await Promise.resolve();
    Sinon.assert.calledOnce(spy);
  });

  it("can dispatch other actions asynchronously", async () => {
    interface State {
      a: number;
      b: number;
      c: number;
    }

    const initState: State = { a: 0, b: 0, c: 0 };
    let reducer = <A extends Action>(state = initState, action: A) => {
      switch (action.type) {
        case "A":
          return { ...state, a: state.a + 1 };
        case "B":
          return { ...state, b: state.b + 1 };
        case "C":
          return { ...state, c: state.c + 1 };
      }
      return state;
    };

    let enhancer = enhancerFactory<State>(async (action, { dispatch }) => {
      switch (action.type) {
        case "A":
          await Promise.resolve();
          dispatch({ type: "B" });
          break;
        case "B":
          await Promise.resolve();
          // Dispatch twice to test debounce below
          dispatch({ type: "C" });
          dispatch({ type: "C" });
          break;
      }
    });
    let store = createStore<State>(reducer, enhancer);
    let spy = Sinon.spy();
    store.subscribe(spy);
    store.dispatch({ type: "A" });
    Sinon.assert.calledOnce(spy);
    expect(store.getState()).to.deep.equal({ a: 1, b: 0, c: 0 });

    // Wait one tick for B dispatch
    await Promise.resolve();
    expect(store.getState()).to.deep.equal({ a: 1, b: 1, c: 0 });

    // Wait one tick for C dispatch
    await Promise.resolve();
    expect(store.getState()).to.deep.equal({ a: 1, b: 1, c: 2 });

    /*
      This is the B dispatch's call to subscribe since we push async
      subscribe updates back one tick to debounce.
    */
    Sinon.assert.calledTwice(spy); // B dispatch call si

    // Wait for subscription to fire after C
    await Promise.resolve();
    Sinon.assert.calledThrice(spy);

    // Make sure no additional subscription triggers on next tick
    await Promise.resolve();
    Sinon.assert.calledThrice(spy);
  });
});