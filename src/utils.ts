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
