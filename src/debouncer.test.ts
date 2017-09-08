import { describe } from './test';
import * as Sinon from 'sinon';
import { Debouncer } from './debouncer';

describe('Debouncer', it => {
  it('defers wrapped function calls to next tick, calls once', async t => {
    let spy = Sinon.spy();
    let debouncer = new Debouncer();
    let debounce = debouncer.debounce.bind(debouncer);
    debounce(spy)();

    // Check not called yet
    t.notCalled(spy);
    await Promise.resolve();

    // Now called
    t.called(spy);
  });

  it('only calls wrapped function at most once per tick', async t => {
    let spy = Sinon.spy();
    let debouncer = new Debouncer();
    let debounce = debouncer.debounce.bind(debouncer);
    let fn = debounce(spy);
    fn();
    fn();
    fn();

    // Wait for a couple ticks to verify no multiple async dispatches
    await Promise.resolve();
    await Promise.resolve();
    t.calledOnce(spy);
  });

  it('does not call wrapped function if never called', async t => {
    let spy = Sinon.spy();
    let debouncer = new Debouncer();
    let debounce = debouncer.debounce.bind(debouncer);
    debounce(spy);

    /*
      Wait a couple of ticks before calling done and verifying spy
      wasn't called.
    */
    await Promise.resolve();
    await Promise.resolve();
    t.notCalled(spy);
  });

  it('can be triggered synchronously with flushing', t => {
    let spy = Sinon.spy();
    let debouncer = new Debouncer();
    let debounce = debouncer.debounce.bind(debouncer);
    let flush = debouncer.flush.bind(debouncer);
    let fn = debounce(spy);
    fn();
    fn();
    flush();
    t.calledOnce(spy);
  });

  it('can debounce multiple functions', t => {
    let spy1 = Sinon.spy();
    let spy2 = Sinon.spy();
    let spy3 = Sinon.spy();
    let debouncer = new Debouncer();
    let debounce = debouncer.debounce.bind(debouncer);
    let flush = debouncer.flush.bind(debouncer);
    debounce(spy1);
    let fn2 = debounce(spy2);
    let fn3 = debounce(spy3);

    fn2();
    fn3();
    fn3();
    flush();

    t.notCalled(spy1);
    t.calledOnce(spy2);
    t.calledOnce(spy3);
  });

  it('resets debounce after each tick', async t => {
    let spy = Sinon.spy();
    let debouncer = new Debouncer();
    let debounce = debouncer.debounce.bind(debouncer);
    let fn = debounce(spy);
    fn();

    await Promise.resolve();
    t.calledOnce(spy);

    fn();
    fn();

    await Promise.resolve();
    t.calledTwice(spy);
  });

  it('resets after flushing', t => {
    let spy = Sinon.spy();
    let debouncer = new Debouncer();
    let debounce = debouncer.debounce.bind(debouncer);
    let flush = debouncer.flush.bind(debouncer);
    let fn = debounce(spy);
    fn();

    flush();
    t.calledOnce(spy);

    fn();
    fn();

    flush();
    t.calledTwice(spy);
  });
});