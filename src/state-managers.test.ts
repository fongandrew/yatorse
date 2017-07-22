import { expect } from "chai";
import * as Sinon from "sinon";
import { isPutAction } from "./reducers";
import { createGetState, createPutState } from "./state-managers";

describe("createGetState creates function that", () => {
  it("returns info from state based on keys", () => {
    let getState = createGetState(() => ({ x: { y: 5 }}));
    expect(getState("x", "y")).to.equal(5);
  });

  it("returns state if no keys", () => {
    let state = { x: { y: 5 }};
    let getState = createGetState(() => state);
    expect(getState()).to.equal(state);
  });

  it("returns undefined for undefined keys", () => {
    let state: any = { x: {} };
    let getState = createGetState(() => state);
    expect(getState("x", "y", "z")).to.be.undefined;
  });
});

describe("createPutState creates function that", () => {
  it("dispatches a putState action with keys and payload", () => {
    let dispatch = Sinon.spy();
    let putState = createPutState(dispatch, () => ({ x: { y: 5 }}));
    putState("x", "y", (n) => n + 1);

    let action = {
      type: "PUT",
      payload: {
        keys: ["x", "y"],
        data: 6
      },
      __putAction: true
    };
    Sinon.assert.calledWith(dispatch, action);

    // Verify this is actually a putAction
    expect(isPutAction(action)).to.be.true;
  });

  it("replaces enter state if no keys", () => {
    let dispatch = Sinon.spy();
    let putState = createPutState(dispatch, () => ({ x: 1 }));
    putState((s) => ({ ...s, x: s.x + 1 }));

    Sinon.assert.calledWith(dispatch, {
      type: "PUT",
      payload: {
        keys: [],
        data: { x: 2 }
      },
      __putAction: true
    });
  });

  it("passes undefined to payload function for undefined keys", () => {
    let dispatch = Sinon.spy();
    let putState = createPutState<any>(dispatch, () => ({ x: {} }));
    putState("x", "y", "z", (n = 0) => n + 1);

    let action = {
      type: "PUT",
      payload: {
        keys: ["x", "y", "z"],
        data: 1
      },
      __putAction: true
    };
    Sinon.assert.calledWith(dispatch, action);
  });
});
