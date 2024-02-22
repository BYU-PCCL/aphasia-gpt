import firebase from "firebase/compat/app";
import { getDatabase, ref, get, type DatabaseReference, set } from "firebase/database";
import type { User } from "firebase/auth";
import { sendEmailVerification } from "@firebase/auth";
import "firebase/compat/auth";
import type { UserDbData } from "./types/UserDbData";
import { getDefaultContextDbData } from "./utils/getDefaultContextDbData";
import type { UserCookies } from "./types/UserCookies";
import { goto } from "$app/navigation";

const firebaseConfig = {
  apiKey: "AIzaSyDOhZYlfsTk_35E2KiHIYw1TB52KwZksMM",
  authDomain: "brocas-userdb.firebaseapp.com",
  databaseURL: "https://brocas-userdb-default-rtdb.firebaseio.com",
  projectId: "brocas-userdb",
  storageBucket: "brocas-userdb.appspot.com",
  messagingSenderId: "795464505175",
  appId: "1:795464505175:web:13d2917301e88d1c5e9012",
};
const alreadyInitializedApps = firebase.apps;
export const app: firebase.app.App =
  alreadyInitializedApps.length === 0
    ? firebase.initializeApp(firebaseConfig, "AphasiaGPT Firebase App")
    : alreadyInitializedApps[0];

export const db = getDatabase(app);

/**
 * Handles the Firebase auth state change, which is triggered when the user signs in or out and also
 * when the page is first loaded and the auth state is restored.
 * @param user Logged-in user, or null if the user is signed out
 */
export async function handleOnAuthStateChange(
  user: User | null,
  onSignedIn: (user: User) => Promise<void>,
  onSignedOut: () => void
): Promise<void> {
  if (user) {
    // User is signed in

    let userName: string | null = null;
    let isNewUser = false;

    try {
      // Verify email
      if (!user.emailVerified) {
        // sendEmailVerification(user);  // TODO: Handle more carefully so as to not spam them with email verification requests
        console.log(`User email is not verified: ${user.email}`);
      }

      // Create user in database, if needed
      const userRef: DatabaseReference = ref(db, `users/${user.uid}`);
      const userDatabaseSnapshot = await get(userRef);
      isNewUser = !userDatabaseSnapshot.exists();
      if (isNewUser) {
        await createUserInDb(userRef);
      } else {
        userName = userDatabaseSnapshot.val().name;
      }
    } catch (error) {
      console.error("Error handling auth state change", error);
    }

    // Set cookies
    await setCookies({
      userFirebaseUid: user.uid,
      userEmail: user.email,
      userName: userName,
    } as UserCookies);

    await onSignedIn(user);

    if (isNewUser) {
      goto("/editprofile");
    }
  } else {
    // User is signed out

    // Clear cookies
    await setCookies(null);

    onSignedOut();
  }
}

/**
 * Set or clear the user cookies
 * @param cookies The user cookies to set, or null to clear the cookies
 */
async function setCookies(cookies: UserCookies | null) {
  if (!cookies) {
    cookies = {
      userFirebaseUid: null,
      userEmail: null,
      userName: null,
    };
  }

  await fetch("/auth/cookies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cookies),
  });
}

// TODO: Perhaps use Vercel functions/API for this?
async function createUserInDb(userRef: DatabaseReference) {
  const newUserData: UserDbData = {
    name: "",
    age: 0,
    about: "",
    context: getDefaultContextDbData(),
  };
  await set(userRef, newUserData);
}
