import test from './test';
import { getMeta, setMeta } from './utils';

test('getMeta', t => {
  let obj = { a: 1, b: { c: 2 } };
  t.equals(getMeta(obj, 'a'), 1);
  t.equals(getMeta(obj, 'b.c'), 2);
  t.equals(getMeta(obj, 'b.d.e'), void 0);
});

test('setMeta', t => {
  let orig = { a: 1, b: { c: 2 } };
  t.deepEquals(
    setMeta(orig, 'a', 2),
    { a: 2, b: { c: 2 } });
  t.deepEquals(
    setMeta(orig, 'b.d.e', 3),
    { a: 1, b: { c: 2, d: { e: 3 } } }
  );
  t.deepEquals(orig, { a: 1, b: { c: 2 } }, 'does not alter original');
});