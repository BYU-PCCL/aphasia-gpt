<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { contextStore } from "../stores/contextStore";
  import { ProfileStore } from "../stores/EditProfileStore";
  import { getAuth, onAuthStateChanged, type Auth, type User } from "firebase/auth";
  import {
    clearUserState,
    initializeUserStateFromUser,
    initializeUserStateFromCookies,
    isLoadingAuthState,
  } from "@/stores/user";

  /**
   * Data supplied by server's `load` function
   */
  export let data;

  onMount(async () => {
    // Initialize user state from cookies first
    await initializeUserStateFromCookies(data.userFirebaseUid, data.userEmail, data.userName);

    // Lazy load the Firebase module
    const module = await import("@/lib/firebase");
    const auth: Auth = getAuth(module.app);

    // Initialize stores (if any asynchronous setup is required)
    await contextStore.initialize();
    await ProfileStore.initialize();

    // Listen for auth state changes after initialization
    onAuthStateChanged(auth, async (user: User | null) => {
      console.log("onauthstatechange");
      console.log("user:", user);
      await module.handleOnAuthStateChange(user, handleUserSignedIn, handleUserSignedOut);
    });

    // Mark loading as complete
    $isLoadingAuthState = false;
  });

  const handleUserSignedIn = async (user: User) => {
    console.log("handleUserSignin", user);
    await initializeUserStateFromUser(user);
    await contextStore.initialize();
    await ProfileStore.initialize();
  };

  const handleUserSignedOut = () => {
    clearUserState();
  };
</script>

<slot />
