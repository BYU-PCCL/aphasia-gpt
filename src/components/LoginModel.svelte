<script lang="ts">
  import { enhance } from "$app/forms";
  import { username } from "@/stores/user";
  import {goto} from '$app/navigation'

  let inputValue = "";
  $: trimmedValue = inputValue.trim();

  function login() {
    $username = trimmedValue;
  }
  function signin(){

  }

  function forget(){

  }
</script>

<main class="absolute w-[100vw] h-[100vh] top-0 z-50 flex justify-center items-center bg-black/30">
  <section class="w-full max-w-xl bg-white px-12 py-24 rounded-md">
    <h1 class="font-medium text-lg">Log in</h1>
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
       
      </div>
      <div
        class="flex justify-between border overflow-hidden border-neutral-200 rounded-md my-2 focus-within:border-neutral-300"
      >
      <input
          type="password"
          placeholder="password"
          class="flex-1 focus:outline-none px-3 py-1"
        />
        <input name="password" value={trimmedValue} hidden required />
      
      </div>
      <div class="text-center">
        <button class="bg-emerald-600 text-white px-2 py-1 rounded-[4px] m-1">Log in</button>
      </div>
</form>



<div class = "text-center">
  
    <button on:click = {() => goto('/signin')} class="bg-neutral-600 text-white px-2 py-1 rounded-[4px] m-1">Sign up</button>
    <button on:click = {() => goto('/forgetpassword')} class=" text-black px-2 py-1 rounded-[4px] m-1">Forget your password?</button>

</div>


  </section>
</main>


