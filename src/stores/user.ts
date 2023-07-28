import { writable } from "svelte/store";

export const username = writable<string | null>(null);
export const aphasiaType = writable("Broca's Aphasia");
    