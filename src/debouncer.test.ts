import { expect } from "chai";
import * as Sinon from "sinon";
import createDebouncer from "./debouncer";
import { nextTick } from "./utils";

// Helper for testing async behavior
const next = () => {
  let r: () => void;
  let p = new Promise((resolve) => r = resolve);
  nextTick(() => r());
  return p;
};

describe("debouncer", () => {
  it("defers wrapped function calls to next tick, calls once", async () => {
    let spy = Sinon.spy();
    let { debounce } = createDebouncer();
    debounce(spy)();

    // Check not called yet
    expect(spy.called).to.be.false;
    await next();

    // Now called
    expect(spy.called).to.be.true;
  });

  it("only calls wrapped function at most once per tick", async () => {
    let spy = Sinon.spy();
    let { debounce } = createDebouncer();
    let fn = debounce(spy);
    fn();
    fn();
    fn();

    // Wait for a couple ticks to verify no multiple async dispatches
    await next();
    await next();
    expect(spy.callCount).to.equal(1);
  });

  it("does not call wrapped function if never called", async () => {
    let spy = Sinon.spy();
    let { debounce } = createDebouncer();
    debounce(spy);

    /*
      Wait a couple of ticks before calling done and verifying spy
      wasn't called.
    */
    await next();
    await next();
    expect(spy.called).to.be.false;
  });

  it("can be triggered synchronously with flushing", () => {
    let spy = Sinon.spy();
    let { debounce, flush } = createDebouncer();
    let fn = debounce(spy);
    fn();
    fn();
    flush();
    expect(spy.callCount).to.equal(1);
  });

  it("can debounce multiple functions", () => {
    let spy1 = Sinon.spy();
    let spy2 = Sinon.spy();
    let spy3 = Sinon.spy();
    let { debounce, flush } = createDebouncer();
    debounce(spy1);
    let fn2 = debounce(spy2);
    let fn3 = debounce(spy3);

    fn2();
    fn3();
    fn3();
    flush();

    expect(spy1.callCount).to.equal(0);
    expect(spy2.callCount).to.equal(1);
    expect(spy3.callCount).to.equal(1);
  });

  it("resets debounce after each tick", async () => {
    let spy = Sinon.spy();
    let { debounce } = createDebouncer();
    let fn = debounce(spy);
    fn();

    await next();
    expect(spy.callCount).to.equal(1);

    fn();
    fn();

    await next();
    expect(spy.callCount).to.equal(2);
  });

  it("resets after flushing", () => {
    let spy = Sinon.spy();
    let { debounce, flush } = createDebouncer();
    let fn = debounce(spy);
    fn();

    flush();
    expect(spy.callCount).to.equal(1);

    fn();
    fn();

    flush();
    expect(spy.callCount).to.equal(2);
  });
});