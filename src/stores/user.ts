import { writable } from "svelte/store";


export const username = writable<string | null>(null);
// export let isMatch =  writable <boolean|null>(null);
// export function setIsMatch(value: boolean) {
//     isMatch.set(value);
// }

export class GlobalVars {
    public static : boolean = false;
  }