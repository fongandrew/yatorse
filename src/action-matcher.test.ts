import * as Sinon from "sinon";
import { createActionMatcher } from "./action-matcher";

describe("action matcher", () => {
  it("returns promises for tests that resolve exactly once for action type",
  async () => {
    let actionMatcher = createActionMatcher();
    let spy1 = Sinon.spy();
    let spy2 = Sinon.spy();
    let spy3 = Sinon.spy();

    actionMatcher.register("A").then(spy1);
    actionMatcher.register("B").then(spy2);
    actionMatcher.register("B").then(spy3);

    // Dispatch type B, target only spy2 / 3
    let actionB1 = { type: "B", val: 123 };
    actionMatcher.dispatch(actionB1);
    await Promise.resolve();

    Sinon.assert.notCalled(spy1);
    Sinon.assert.calledWith(spy2, actionB1);
    Sinon.assert.calledWith(spy3, actionB1);

    // Run again and verify spies not called a second time
    let actionB2 = { type: "B", val: 456 };
    actionMatcher.dispatch(actionB2);
    await Promise.resolve();

    Sinon.assert.notCalled(spy1);
    Sinon.assert.calledOnce(spy2);
    Sinon.assert.calledOnce(spy3);
  });

  it("returns promises for tests that resolve exactly one for action type",
  async () => {
    let actionMatcher = createActionMatcher();
    let spy1 = Sinon.spy();
    let spy2 = Sinon.spy();
    let spy3 = Sinon.spy();

    actionMatcher.register((a: any) => a.payload === 0).then(spy1);
    actionMatcher.register((a: any) => a.payload === 0).then(spy2);
    actionMatcher.register((a: any) => a.payload === 1).then(spy3);

    // Dispatch to target only spy1, spy2
    let action1 = { type: "WHATEVER", payload: 0 };
    actionMatcher.dispatch(action1);
    await Promise.resolve();

    Sinon.assert.calledWith(spy1, action1);
    Sinon.assert.calledWith(spy2, action1);
    Sinon.assert.notCalled(spy3);

    // Run again and verify spies not called a second time
    let action2 = { type: "WHOMEVER", payload: 0 };
    actionMatcher.dispatch(action2);
    await Promise.resolve();

    Sinon.assert.calledOnce(spy1);
    Sinon.assert.calledOnce(spy2);
    Sinon.assert.notCalled(spy3);
  });
});
