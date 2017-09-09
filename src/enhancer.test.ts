import { createStore, Reducer } from 'redux';
import { default as enhancerFactory, Domain } from './index';
import { describe } from './test';

// Do-nothing reducer proc testing
const noopReducer: Reducer<any> = (state = {}, action) => state;

describe('Enhancer with domains', it => {
  it('adds to init state, does not interrupt reducer flow', (t, s) => {
    let reducer = s.spy(noopReducer);
    let subscriber = s.spy();
    let enhancer = enhancerFactory({
      ducks: new Domain(0, () => ({}))
    }, { fingerprinting: false });
    let store = createStore(reducer, enhancer);
    store.subscribe(subscriber);

    reducer.reset();
    subscriber.reset();

    store.dispatch({ type: 'TEST' });
    t.calledOnce(reducer);
    t.calledWith(reducer, { ducks: 0 }, {type: 'TEST'});
    t.calledOnce(subscriber);
  });
});