import { expect } from "chai";
import * as Sinon from "sinon";
import { isPutAction } from "./reducers";
import { createGetState, createPutState } from "./state-managers";
import { FullConfig } from "./types";

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
  const conf = {
    putActionKey: "__putAction",
    putActionType: (a) => a.type + "/TEST_PUT"
  } as FullConfig;

  const getPutState = <S>(dispatch: Sinon.SinonSpy, state: S) => {
    return createPutState({ type: "INCR" }, dispatch, () => state, conf);
  };

  it("dispatches a putState action with keys, payload, and custom type", () => {
    let dispatch = Sinon.spy();
    let putState = getPutState(dispatch, { x: { y: 5 }});
    putState("x", "y", (n) => n + 1);

    let action = {
      type: "INCR/TEST_PUT",
      payload: {
        keys: ["x", "y"],
        data: 6
      },
      __putAction: true
    };
    Sinon.assert.calledWith(dispatch, action);

    // Verify reducer recognizes this
    expect(isPutAction(action, conf)).to.be.true;
  });

  it("replaces enter state if no keys", () => {
    let dispatch = Sinon.spy();
    let putState = getPutState(dispatch, { x: 1 });
    putState((s) => ({ ...s, x: s.x + 1 }));

    Sinon.assert.calledWith(dispatch, {
      type: "INCR/TEST_PUT",
      payload: {
        keys: [],
        data: { x: 2 }
      },
      __putAction: true
    });
  });

  it("passes undefined to payload function for undefined keys", () => {
    let dispatch = Sinon.spy();
    let putState = getPutState<any>(dispatch, { x: {} });
    putState("x", "y", "z", (n = 0) => n + 1);

    Sinon.assert.calledWith(dispatch, {
      type: "INCR/TEST_PUT",
      payload: {
        keys: ["x", "y", "z"],
        data: 1
      },
      __putAction: true
    });
  });

  it("allows setting a meta key for putAction config", () => {
    let dispatch = Sinon.spy();
    let metaConf = { ...conf, metaKey: "meta" };
    let putState = createPutState(
      { type: "INCR" },
      dispatch,
      () => ({ x: 2 }),
      metaConf
    );
    putState("x", (n) => n + 1);

    let action = {
      type: "INCR/TEST_PUT",
      payload: {
        keys: ["x"],
        data: 3
      },
      meta: {
        __putAction: true
      }
    };
    Sinon.assert.calledWith(dispatch, action);

    // Verify reducer recognizes meta
    expect(isPutAction(action, conf)).to.be.false;
    expect(isPutAction(action, metaConf)).to.be.true;
  });
});
