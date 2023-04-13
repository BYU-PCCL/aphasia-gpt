<script lang="ts">
  import type { PageData } from "./$types";
  import { enhance } from "$app/forms";
  import LoginModel from "@/components/LoginModel.svelte";
  import Controls from "@/components/Controls.svelte";
  import { transcriptProcessor } from "@/stores/transcriptProcessor";
  import { username } from "@/stores/user";
  import { onMount } from "svelte";

  // Mic requires browser environment
  let Mic: null | typeof import("@/components/Mic.svelte").default = null;
  onMount(async () => {
    Mic = (await import("@/components/Mic.svelte")).default;
  });

  export let data: PageData;
  let isRecording = false;
  $: hasTranscript = $transcriptProcessor.transcript !== "";

  $: {
    $username = data.username;
  }

  function toggleRecording() {
    isRecording = !isRecording;
  }

  function logout() {
    $username = null;
  }

  function onFail(message: string) {
    isRecording = false;
    alert(message);
  }
</script>

{#if !$username}
  <LoginModel />
{/if}

<main>
  <header class="flex justify-between items-start px-4 py-2 mb-4">
    <h1 class="block font-bold text-2xl mb-4">Aphasia GPT</h1>

    {#if $username}
      <form method="POST" action="/?/logout" use:enhance={logout} class="flex items-baseline gap-4">
        <div>Hi {$username} 👋</div>
        <button class="bg-neutral-800 text-white px-2 py-1 rounded-md block ml-auto mr-0 mt-1"
          >Log Out</button
        >
      </form>
    {/if}
  </header>

  {#if Mic !== null}
    <Mic {isRecording} {onFail} onChange={transcriptProcessor.addTranscriptChunk} />
  {/if}
  <Controls
    {isRecording}
    {hasTranscript}
    {toggleRecording}
    onBack={transcriptProcessor.back}
    onNew={transcriptProcessor.clear}
  />

  <section>
    <h2>What we think you said:</h2>
    <p>{$transcriptProcessor.transcript}</p>
    <h2>What we think you are trying to say:</h2>
    {#each $transcriptProcessor.transformations as transformation}
      <p>{transformation}</p>
    {/each}
  </section>
</main>
