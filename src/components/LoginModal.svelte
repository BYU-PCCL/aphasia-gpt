<script lang="ts">
  import "firebaseui/dist/firebaseui.css";
  import firebase from "firebase/compat/app";
  import "firebase/compat/auth";
  import { onMount } from "svelte";
  import { app } from "@/lib/firebase";

  let ui: firebaseui.auth.AuthUI | null;
  let loader: HTMLElement;

  onMount(async () => {
    const firebaseui = await import("firebaseui");  // Must be imported dynamically onMount to avoid SSR
    ui = firebaseui.auth.AuthUI.getInstance();
    if (!ui) {
      ui = new firebaseui.auth.AuthUI(app.auth());
    } else {
      ui.reset();
    }

    const uiConfig = {
      signInOptions: [
        {
          provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
          requireDisplayName: false,
        },
      ],
      callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl: string | undefined) {
          return false; // Do not attempt a redirect on successful sign in
        },
        uiShown: function () {
          // The widget is rendered.
          loader.style.display = "none";
        },
      },
    } as firebaseui.auth.Config;

    ui.start("#firebaseui-auth-container", uiConfig);
  });
</script>

<main class="absolute w-[100vw] h-[100vh] top-0 z-50 flex justify-center items-center bg-black/30">
  <div id="firebaseui-auth-container" />
  <section id="loader" bind:this={loader} class="w-36 h-36 bg-white flex items-center justify-center">
    <span>Loading...</span>
  </section>
</main>
