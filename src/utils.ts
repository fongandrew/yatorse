import { Action } from "redux";

/*
  Random string generator. Not crypto-secure, but doesn't have to be for our
  purposes. Used to create random IDs.
*/
const randomString = (numChars: number) => {
  const charSet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const chars: string[] = [];
  for (let i = 0; i < numChars; i++) {
    let n = Math.floor(Math.random() * charSet.length);
    chars.push(charSet.charAt(n));
  }
  return chars.join("");
};

/*
  Defaut ID function for Action
*/
export const idFn = (action: Action) => {
  return action.type + "#"  + randomString(7);
};

// For meta functions below
const separator = ".";

/*
  Returns key on object, treating separator in key as sub-accessors
*/
export const getMeta = (obj: any, key: string): any => {
  let current = obj;
  let parts = key.split(separator);
  for (let key in parts) {
    if (! current) return undefined;
    current = current[key];
  }
  return current;
};

/*
  Helper function sets a key on object,
  treating separator in key as sub-accessors
*/
export const setMeta = (obj: any, key: string, val: any) => {
  let ret = { ...obj };
  let parent = ret;
  let parts = key.split(separator);
  parts.slice(0, -1).forEach(k => {
    parent[k] = { ...parent[k] };
    parent = parent[k];
  });
  parent[parts[parts.length - 1]] = val;
  return ret;
};