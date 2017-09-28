Yet Another Take on Redux Side Effects
======================================

WIP. Middleware + helpers for triggering side effects from action dispatches.

Requirements
---
ES5 map helpers
ES6 Object.assign


TODO
----
[x] Test call
[x] Test multiple continuation actions
[x] Test instance actions
[x] Test maxIterations
[x] Test no instance continuation between dispatches
[x] Test effects are called
[x] Test effect dispatches have origin
[x] Test multiple subsequent dispatch effects (3x)
[x] Test fingerprinting
[x] Test helper for wrap
[x] Cmd.dispatch, Cmd.setState
[x] Get rid of instance var
[ ] Sample Webpack with devtools

Fetch Examples
--------------
```js
const apiWrap = (fn) => (dispatch) => async (...args) => {
  dispatch({ type: "API_HOOK", status: "START" });

  try {
    let ret = await fn(args);
    dispatch({ type: "API_HOOK", status: "END" });
    return ret;
  }

  catch (err) {
    dispatch({ type: "API_HOOK", status: "ERROR" });
    throw err;
  }
};

const fetchByIdWrap = (fetchById, hooks) => async id => {
  let { getState, putState } = hooks;
  let state = getState();
  if (! state[id]) {
    putState(state => ({ ...state, [id]: "FETCHING" }));

    try {
      let data = await fetchById(id);
      putState(state => ({ ...state, [id]: data }));
    }

    catch (err) {
      putState(state => ({ ...state, [id]: undefined }));
    }
  }
};

const fetchDog = apiWrap(Api.fetchDog);
const dogGetter = (getState) => () => getState().dogs;
const dogPutter = (putState) => (fn) => putState("dogs", fn);
const dogHandler = async (action, hooks) => {
  let action = { type, id };
  if (type === "FETCH_DOG") {
    await fetchByIdWrap(fetchDog(hooks.dispatch), hooks)(id);
  }
};

const fetchCat = apiWrap(Api.fetchCat);
const catGetter = (getState) => () => getState().cats;
const catPutter = (putState) => (fn) => putState("cats", fn);
const catHandler = async (action, hooks) => {
  let action = { type, id };
  if (type === "FETCH_CAT") {
    await fetchByIdWrap(fetchCat(hooks.dispatch), hooks)(id);
  }
};

const apiGetter = (getState) => () => (getState().apiCalls || 0);
const apiPutter = (putState) => (val) =>
  putState("apiCalls", (c = 0) => c + val);
const apiHander = (action, hooks) => {
  let action = { type, status };
  if (type === "API_HOOK") {
    let putApi = apiPutter(hooks.putState);
    switch (status) {
      case "START":
        putApi(1);
        break;
      case "END":
        putApi(-1);
        break;
      case "ERROR":
        putApi(-1);
        break;
    }
  }
}
```


Timer Examples
--------------

```js

const countGetter = (getState) => () => (getState().count || 0);
const countPutter = (putState) => (val) =>
  putState("count", (c = 0) => c + val);
const countHandler = (action, hooks) => {
  let action = { type };
  let { getState, putState } = hooks;
  let getCount = countGetter(getState);
  let putCount = countPutter(putState);

  if (type === "FETCH_START") {
    let active = true;
    while (active) {
      let result = await Promise.race([take("FETCH_END"), delay(1000)])
      if (result[1]) {
        active = false;
      } else {
        putCount(1);
      }
    }
  }
}

```

Redux Logs
----------
type: FETCH_DOGS/start,
__dispatches: [
  { type: "OTHER_1", ... },
  { type: "OTHER_2", ... }
],
__puts: [
  ["dogs", "someId", { ... }],
  ["dogs", "otherId", { ... }]
],
__done: false

type: FETCH_DOGS/1,
__puts: [
  ["dogs", "someId", { ... }],
  ["dogs", "otherId", { ... }]
],
__done: true

type: FETCH_DOGS/end,
__puts: [
  ["dogs", "someId", { ... }],
  ["dogs", "otherId", { ... }]
],
__done: true

on("ACTION TYPE", "state", (cb) => { ... })


```ts
let cat = new Domain({}, {
  meow: (s, a) => s,
  purr: (s, a) => s
});

cat.on("WHATEVER", (action, { meow }) => {
  meow();
});

cat.on("OTHER", (action, { purr }) => {
  purr();
});

```


```ts
class Cats extends Domain {
  constructor(
    protected api: API;
    protected localStore: LocalStore;
  ) {
    this.reducer1 = makeReducer()
    this.reducer2

    super(initState, () => {
      ...
      name: () => {

      },


    });
    

    this.on(s, () => {})
  }

  reducer1 = makeReducer(() => {

  });

  reduce2 = makeReducer<S>(() => {

  })

  @on('TYPE')
  doThing(action: Action.TYPE) {
    this.reducer2
    this.reduce1
  }
}

///

let createCatsDomain = (api, localStore) => {
  let domain = createDomain(() => {

  });

  domain.on('TYPE', (action, handlers) => { ... });

  domain.on('TYPE', (action, handlers) => { ... });

  domain.on('TYPE', (action, handlers) => { ... });

  return domain;

  createDomain((reducers, on) => {
    let { a, b } = reducers({
      a: (state, action) => state,
      b: (state, action) => state
    })

    on('TYPE', action => { ... });
  });

//// 


let enhancer = createEnhancer({ cats: new Cats(...) }, conf)
createStore(
  enhancer
)
```

