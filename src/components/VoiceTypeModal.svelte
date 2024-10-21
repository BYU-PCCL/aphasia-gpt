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
      <div class="flex items-center justify-between p-4 border rounded-md shadow-sm {voice === selectedVoice ? 'border-blue-700' : 'border-gray-300'}">
        <div class="flex flex-col">
          <div class="flex items-center">
            <!-- Text is always black -->
            <span class="font-semibold text-lg text-black">{voice.name}</span>
            <button
              class="ml-2 text-black px-2 py-1 rounded-full hover:text-gray-700"
              on:click={() => playVoiceSample(voice)}
            >
              <i class="material-icons">
                {currentlyPlayingVoice === voice ? 'pause' : 'play_arrow'}
              </i>
            </button>
          </div>
          <p class="text-black">{voice.sampleText}</p>
        </div>
        <div>
          <button
            class={`px-4 py-2 rounded-md ${voice === selectedVoice ? 'bg-blue-700 text-white' : 'bg-blue-200 text-black'} hover:bg-blue-300`}
            on:click={() => selectVoice(voice)}
          >
            {voice === selectedVoice ? 'Selected' : 'Select'}
          </button>
        </div>
      </div>
    {/each}
  </div>
  <div class="flex justify-center mt-4">
    <button class="px-4 py-2 bg-gray-400 text-black rounded-md hover:bg-gray-500" on:click={toggleVoiceTypesModal}>
      Close
    </button>
  </div>
</Modal>
