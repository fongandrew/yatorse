import { expect } from "chai";
import call from "./call";

describe("call", () => {
  it("returns declarative object representing function call", () => {
    let fn = (x: number, y: number) => x + y;
    expect(call(fn, 1, 2)).to.deep.equal({
      fn, args: [1, 2], context: null
    });
  });

  it("can be called with context using 2-tuple", () => {
    let context = {
      z: 3,
      fn(x: number, y: number) {
        return x + y + this.z;
      }
    };
    expect(call([context, context.fn], 1, 2)).to.deep.equal({
      fn: context.fn,
      args: [1, 2],
      context
    });
  });

  it("can be called with context using object", () => {
    let context = {
      z: 3,
      fn(x: number, y: number) {
        return x + y + this.z;
      }
    };
    expect(call({ context, fn: context.fn }, 1, 2)).to.deep.equal({
      fn: context.fn,
      args: [1, 2],
      context
    });
  });

  it("can be called with context and a string name", () => {
    let context = {
      z: 3,
      myFn(x: number, y: number) {
        return x + y + this.z;
      }
    };
    expect(call([context, "myFn"], 1, 2)).to.deep.equal({
      fn: context.myFn,
      args: [1, 2],
      context
    });
  });
});