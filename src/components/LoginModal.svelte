<script lang="ts">
  import "firebaseui/dist/firebaseui.css";
  import firebase from "firebase/compat/app";
  import "firebase/compat/auth";
  import { onMount, onDestroy } from "svelte";
  import { app } from "@/lib/firebase";

  let ui: firebaseui.auth.AuthUI | null;
  let loader: HTMLElement;
  let firebaseUiAuthContainer: HTMLElement;
  let hasEmailSignInFormElement = false;
  let observer: MutationObserver;

  onMount(async () => {
    const firebaseui = await import("firebaseui");  // Must be imported dynamically onMount to avoid SSR
    ui = firebaseui.auth.AuthUI.getInstance();
    if (!ui) {
      ui = new firebaseui.auth.AuthUI(app.auth());
    } else {
      ui.reset();
    }

    const firebaseUiConfig = {
      signInOptions: [
        {
          provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
          requireDisplayName: false,
        },
        {
          provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          customParameters: {
            prompt: "select_account",
          },
        }
      ],
      callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl: string | undefined) {
          firebaseUiAuthContainer.style.display = "none"; // Hide the UI container that would display before the modal gets hidden
          return false; // False means it will not attempt a redirect on successful sign in
        },
        uiShown: function () {
          // The widget is rendered.
          loader.style.display = "none";
        },
      },
    } as firebaseui.auth.Config;

    ui.start("#firebaseui-auth-container", firebaseUiConfig);

    // Observe the container for the presence of the email sign-in form (depends on user selection)
    const container = document.querySelector('#firebaseui-auth-container');
    if (container) {
      observer = new MutationObserver((mutationsList, observer) => {
        for(let mutation of mutationsList) {
          if (mutation.type === 'childList') {
            hasEmailSignInFormElement =
              !!container.querySelector('.firebaseui-id-page-sign-in') ||
              !!container.querySelector('.firebaseui-id-page-password-sign-up') ||
              !!container.querySelector('.firebaseui-id-page-password-sign-in') ||
              !!container.querySelector('.firebaseui-id-page-password-recovery') ||
              !!container.querySelector('.firebaseui-id-page-password-recovery-email-sent');
          }
        }
      });
      observer.observe(container, { childList: true });
    }
  });

  onDestroy(() => {
    observer.disconnect();
  });
</script>

<main class="absolute w-[100vw] h-[100vh] top-0 z-50 flex justify-center items-center bg-black/30">
  <div id="firebaseui-auth-container" bind:this={firebaseUiAuthContainer} class="{!hasEmailSignInFormElement ? 'bg-white p-6' : ''}" />
  <section id="loader" bind:this={loader} class="w-36 h-36 bg-white flex items-center justify-center">
    <span>Loading...</span>
  </section>
</main>
