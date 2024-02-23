import type { User } from "firebase/auth";
import { writable } from "svelte/store";
import { db } from "@/lib/firebase";
import { ref, get } from "firebase/database";

export const userName = writable<string | null>(null);
export const userEmail = writable<string | null>(null);
export const userFirebaseUid = writable<string | null>(null);
/**
 * Whether the authentication/user state is still being loaded
 */
export const isLoadingAuthState = writable<boolean>(true);

export async function initializeUserStateFromCookies(
  firebaseUid: string | null,
  email: string | null,
  name: string | null
) {
  userFirebaseUid.set(firebaseUid);
  userEmail.set(email);
  userName.set(name);
}

export async function initializeUserStateFromUser(user: User) {
  userFirebaseUid.set(user.uid);
  userEmail.set(user.email);

  const userRef = ref(db, `users/${user.uid}`);
  const snapshot = await get(userRef);
  if (snapshot.exists()) {
    const name = snapshot.val().name;
    if (name) {
      userName.set(name);
    }
  }
}

export function clearUserState() {
  userFirebaseUid.set(null);
  userEmail.set(null);
  userName.set(null);
}
