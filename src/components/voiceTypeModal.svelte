<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import Modal from "./Modal.svelte";
  import { contextStore } from "../stores/contextStore";

  export let toggleVoiceTypesModal: () => void;

  let voices = [];
  let selectedVoice = null;
  let currentAudio = null;
  let currentlyPlayingVoice = null;

  const unsubscribe = contextStore.subscribe((value) => {
    voices = value.voiceContext.availableVoices;
    selectedVoice = value.voiceContext.selectedVoice;
  });

  const playVoiceSample = (voice) => {
    if (currentAudio) {
      currentAudio.pause();
      if (currentlyPlayingVoice === voice) {
        currentAudio = null;
        currentlyPlayingVoice = null;
        return;
      }
    }
    currentAudio = new Audio(voice.url);
    currentAudio.play();
    currentAudio.onended = () => {
      currentlyPlayingVoice = null;
      currentAudio = null;
    };
    currentlyPlayingVoice = voice;
  };

  const selectVoice = (voice) => {
    contextStore.selectVoice(voice);
  };

  onMount(() => {
    selectedVoice = get(contextStore).voiceContext.selectedVoice;
    return () => unsubscribe(); // Cleanup subscription on component unmount
  });
</script>

<Modal title="Voice Types" toggleVisibility={toggleVoiceTypesModal}>
  <div class="flex flex-col gap-4">
    {#each voices as voice}
      <div class={`flex items-center justify-between p-4 border rounded-md shadow-sm ${voice === selectedVoice ? 'border-green-500' : ''}`}>
        <div class="flex flex-col">
          <div class="flex items-center">
            <span class="font-semibold text-lg">{voice.name}</span>
            <button
              class="ml-2 text-black px-2 py-1 rounded-full hover:text-gray-700"
              on:click={() => playVoiceSample(voice)}
            >
              <i class="material-icons">
                {currentlyPlayingVoice === voice ? 'pause' : 'play_arrow'}
              </i>
            </button>
          </div>
          <p class="mt-1">{voice.sampleText}</p>
        </div>
        <div>
          <button
            class={`px-4 py-2 rounded-md hover:bg-green-600 ${voice === selectedVoice ? 'bg-gray-500' : 'bg-green-500 text-white'}`}
            on:click={() => selectVoice(voice)}
          >
            {voice === selectedVoice ? 'Selected' : 'Select'}
          </button>
        </div>
      </div>
    {/each}
  </div>
  <div class="flex justify-center mt-4">
    <button class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600" on:click={toggleVoiceTypesModal}>Close</button>
  </div>
</Modal>

<style>
  .modal-content {
    max-width: 600px;
    width: 100%;
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }

  .material-icons {
    font-size: 24px;
  }
</style>
