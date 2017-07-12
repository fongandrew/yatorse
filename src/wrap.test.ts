import { expect } from "chai";
import * as Sinon from "sinon";
import call from "./call";
import { default as Context, reset } from "./context";
import wrap from "./wrap";

type State = {
  count: number
};

type IncrAction = {
  type: "INCR",
  val: number
};

const initState = { count: 0 };

describe("wrap", () => {
  beforeEach(() => reset());

  describe("with state-only reducer", () => {
    const action = { type: "INCR", val: 1 };
    const reducer = (state: State, action: IncrAction) => ({
      state: { count: state.count + action.val }
    });

    it("returns reducer that returns state", () => {
      expect(wrap(reducer)(initState, action)).to.deep.equal({
        count: 1
      });
    });
  });

  describe("with state + effects function reducer", () => {
    const effectsFn = () => { throw new Error("Don't call me"); };
    const effect1 = call([console, "log"], "ABC");
    const effect2 = call([console, "log"], "DEF");

    const action = { type: "INCR", val: 1 };
    const callReducer = (effects: any) => wrap(
      (state: State, action: IncrAction) => ({
        state: { count: state.count + action.val },
        effects
      })
    )(initState, action);

    it("returns reducer that returns state", () => {
      expect(callReducer(effectsFn)).to.deep.equal({ count: 1 });
    });

    it("doesn't do anything with effects if not set in Context", () => {
      callReducer(effectsFn);
      expect(Context.effects).to.be.undefined;
    });

    describe("with Context.effects set to array", () => {
      beforeEach(() => Context.effects = []);

      it("stores effect function in Context", () => {
        callReducer(effectsFn);
        expect(Context.effects).to.deep.equal([effectsFn]);
      });

      it("stores effects list in Context", () => {
        callReducer([effect1, effect2]);
        expect(Context.effects).to.deep.equal([effect1, effect2]);
      });

      it("stores single effect in Context", () => {
        callReducer(effect1);
        expect(Context.effects).to.deep.equal([effect1]);
      });
    });
  });

  describe("with state + actions reducer", () => {
    const action0 = { type: "INCR", val: 1 };
    const action1 = {
      type: "ACTION_1",
      payload: 123
    };
    const action2 = {
      type: "ACTION_2",
      payload: 456
    };
    const callReducer = (actions: any) => wrap(
      (state: State, action: IncrAction) => ({
        state: { count: state.count + action.val },
        actions
      })
    )(initState, action0);

    it("returns reducer that returns state", () => {
      expect(callReducer([action1, action2])).to.deep.equal({ count: 1 });
    });

    it("stores actions list in Context", () => {
      callReducer([action1, action2]);
      expect(Context.actions).to.deep.equal([action1, action2]);
    });

    it("stores single action in Context", () => {
      callReducer(action1);
      expect(Context.actions).to.deep.equal([action1]);
    });
  });

  describe("with instance count", () => {
    const reducer = (state: State, action: IncrAction, count = 0) => ({
      state: { count: state.count + action.val + (count || 0) }
    });
    const action = { type: "INCR", val: 1 };

    it("updates count on each subsequent call", () => {
      let spy = Sinon.spy(reducer);
      let wrapped = wrap(spy);

      let state = wrapped(initState, action);
      Sinon.assert.calledWith(spy, initState, action, 0);

      wrapped(state, action);
      Sinon.assert.calledWith(spy, state, action, 1);
    });

    it("resets instance if Context.iteration advances", () => {
      let spy = Sinon.spy(reducer);
      let wrapped = wrap(spy);

      let state = wrapped(initState, action);
      Sinon.assert.calledWith(spy, initState, action, 0);

      Context.iteration++;
      wrapped(state, action);
      Sinon.assert.calledWith(spy, state, action, 0);
    });
  });
});


