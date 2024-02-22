<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { contextStore } from "../stores/contextStore";
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
    await initializeUserStateFromCookies(data.userFirebaseUid, data.userEmail, data.userName);
    const module = await import("@/lib/firebase");
    const auth: Auth = getAuth(module.app);
    await contextStore.initialize();

    $isLoadingAuthState = false;
    onAuthStateChanged(auth, async (user: User | null) => {
      await module.handleOnAuthStateChange(user, handleUserSignedIn, handleUserSignedOut);
    });
  });

  const handleUserSignedIn = async (user: User) => {
    await initializeUserStateFromUser(user);
    await contextStore.initialize();
  };

  const handleUserSignedOut = () => {
    clearUserState();
  };
</script>

<slot />
