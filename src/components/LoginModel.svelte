<script lang="ts">
  import { enhance } from "$app/forms";
  import { username } from "@/stores/user";

  let inputValue = "";
  $: trimmedValue = inputValue.trim();

  function login() {
    $username = trimmedValue;
  }
</script>

<main class="absolute w-[100vw] h-[100vh] top-0 z-50 flex justify-center items-center bg-black/30">
  <section class="w-full max-w-xl bg-white px-12 py-24 rounded-md">
    <h2 class="font-medium text-lg">Log in with email</h2>
    <form method="POST" action="/?/login" use:enhance={login}>
      <div
        class="flex justify-between border overflow-hidden border-neutral-200 rounded-md my-2 focus-within:border-neutral-300"
      >
        <input
          type="text"
          bind:value={inputValue}
          placeholder="grant@gmail.com"
          class="flex-1 focus:outline-none px-3 py-1"
        />
        <input name="username" value={trimmedValue} hidden required />
        <button class="bg-emerald-600 text-white px-2 py-1 rounded-[4px] m-1">Continue</button>
      </div>
    </form>
    <h1 class="text-center">*we won't email you, any unique identifier will work</h1>
  </section>
</main>
