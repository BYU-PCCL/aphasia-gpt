<script lang="ts">
  import { fly } from "svelte/transition";

  export let isRecording: boolean;
  export let hasTranscript: boolean;
  export let toggleRecording: () => void;
  export let onNew: () => void;
  export let onBack: () => void;

  $: showExtraControls = hasTranscript || isRecording;
</script>

<section class="flex gap-1 justify-center">
  {#if showExtraControls}
    <button
      on:click={onNew}
      class="inline-block rounded-full bg-sky-100 text-sky-500 p-10"
      transition:fly={{ x: 160, duration: 250, opacity: 1 }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="w-14 h-14"
      >
        <path
          fill-rule="evenodd"
          d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  {/if}

  <button on:click={toggleRecording} class="inline-block rounded-full bg-red-100 text-red-500 p-10 z-10">
    {#if isRecording}
      <div class="w-10 h-10 m-2 rounded-md bg-red-500" />
    {:else}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="w-14 h-14"
      >
        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
        <path
          d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z"
        />
      </svg>
    {/if}
  </button>
  {#if showExtraControls}
    <button
      on:click={onBack}
      class="inline-block rounded-full bg-stone-200/80 text-stone-500 p-10"
      transition:fly={{ x: -160, duration: 250, opacity: 1 }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="w-14 h-14"
      >
        <path
          fill-rule="evenodd"
          d="M2.515 10.674a1.875 1.875 0 000 2.652L8.89 19.7c.352.351.829.549 1.326.549H19.5a3 3 0 003-3V6.75a3 3 0 00-3-3h-9.284c-.497 0-.974.198-1.326.55l-6.375 6.374zM12.53 9.22a.75.75 0 10-1.06 1.06L13.19 12l-1.72 1.72a.75.75 0 101.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06L15.31 12l1.72-1.72a.75.75 0 10-1.06-1.06l-1.72 1.72-1.72-1.72z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  {/if}
</section>
