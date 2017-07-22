import { expect } from "chai";
import { reducePutFactory } from "./reducers";
import { PutAction } from "./types";

const reducePut = reducePutFactory({
  type: (action) => action.type + "/PUT",
  test: (type) => {
    // string.endsWith("/PUT") with legacy browser supports
    const suffix = "/PUT";
    const n = type.lastIndexOf(suffix);
    return n >= 0 && n === type.length - suffix.length;
  }
});

const createAction = (keys: string[], data: any): PutAction => ({
  type: "TEST/PUT",
  payload: { keys, data }
});

describe("reducePut", () => {
  it("doesn't mutate state", () => {
    let s1 = { a: 123 };
    let action = createAction(["b"], 456);
    let s2 = reducePut(s1, action);
    expect(s1).to.deep.equal({ a: 123 });
    expect(s2).to.deep.equal({ a: 123, b: 456 });
  });

  it("ignores non-put actions", () => {
    let s1 = { a: 123 };
    let action = {
      ...createAction(["b"], 456),
      type: "BLA"
    };
    let s2 = reducePut(s1, action);
    expect(s2).to.deep.equal(s1);
  });

  it("returns empty object if undefined state", () => {
    let action = createAction(["b"], 456);
    expect(reducePut(undefined, action)).to.deep.equal({
      b: 456
    });
  });

  it("creates objects for deeply undefined substates", () => {
    let s1 = { a: 123, b: { c: 456 } };
    let action = createAction(["b", "d", "e"], 789);
    expect(reducePut(s1, action)).to.deep.equal({
      a: 123,
      b: {
        c: 456,
        d: { e: 789 }
      }
    });
  });

  it("sets variables in existing substate", () => {
    let s1 = { a: 123, b: { c: { d: 456 } } };
    let action = createAction(["b", "c", "e"], 789);
    expect(reducePut(s1, action)).to.deep.equal({
      a: 123,
      b: {
        c: {
          d: 456,
          e: 789
        }
      }
    });
  });
});
