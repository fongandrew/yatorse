export { call } from "./effects";
export { dispatch } from "./placeholders";
export {
  Effect,
  EffectFn,
  EffectNamedFn,
  Config,
  Continuation,
  Loop
} from "./types";
export { unwrap, unwrapAll } from "./unwrap";
export { default as wrap } from "./wrap";

import enhancerFactory from "./enhancer";
export default enhancerFactory;