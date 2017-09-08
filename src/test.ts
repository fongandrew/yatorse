/*
  Convenience wrappers around tape that sets up Sinon sandboxing. Integrates
  some assertions between sinon and tape. Handles calling test.end. Usage:

    describe('myFunction', it => {
      it('stores API result', async (assert, sandbox) => {
        let apiSpy = sandbox.stub(Api, 'getThing', 'id')
          .returns(Promise.resolve('result'));
        let storeSpy = sandbox.stub(Store, 'set');
        await myFunction();
        assert.calledWith(apiSpy, 'id');
        assert.calledWith(storeSpy, 'result');
      });
    });
*/

import tape = require('tape');
import { Test } from 'tape'; // Type
import * as sinon from 'sinon';

// Get type with actual Sinon asseriotns
const { pass, fail, ...sinonAssertTmp } = sinon.assert;
export const sinonAssert = sinonAssertTmp;
export type SinonAssertions = typeof sinonAssert;

// Combine Tape and Sinon assertions / matches into one object.
export interface Assertions extends Test, SinonAssertions {
  match: typeof sinon.match;
}

export type TestCase =
  (assert: Assertions, sandbox: sinon.SinonSandbox) => void|Promise<void>;

export const test = (name: string, tc: TestCase) => tape(name, t => {
  // See https://github.com/substack/tape/issues/386
  if (! tc.name) {
    Object.defineProperty(tc, 'name', {
      value: '<anonymous>'
    });
  }

  const assert: Assertions = {
    ...t,
    ...sinon.assert,
    match: sinon.match
  };

  // Connect Sinon hooks with Tape
  sinon.assert.pass = (assertion) => t.pass(assertion);
  sinon.assert.fail = (message) => {
    let err = new Error(message);
    err.name = sinon.assert.failException;
    t.error(err);
  };

  // Create sinon sandbox -- restore and call appropriate Tape assertion
  // at the end of test.
  const sandbox = sinon.sandbox.create();
  Promise.resolve(tc(assert, sandbox)).then(
    () => {
      sandbox.restore();
      t.end();
    },

    (err) => {
      sandbox.restore();
      console.error(err); // Get proper stack trace
      t.error(err);
    });
});

// Group tape tests together
export const describe = function(
  groupName: string,
  fn: (it: typeof test) => void
) {
  fn((name, tc) => test(`${groupName}: ${name}`, tc));
};

export default test;