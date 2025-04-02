<script lang="ts">
  import { Textarea, Toolbar, ToolbarButton, Button } from 'flowbite-svelte';
  import { onMount } from 'svelte';

  let voices = ['Alloy', 'Ash', 'Coral', 'Echo', 'Fable', 'Onyx', 'Nova', 'Sage', 'Shimmer'];
  export let textAreaClass = 'w-full max-w-full p-4';
  export let value = '';
  export let bindValue;

  let tabs = [
    {
      id: 1,
      name: 'Tab 1',
      prompt: 'You are simulating a person with aphasia. You must repeat everything that you hear, but you must attempt to make it sound like a person with aphasia is speaking. People with aphasia speak in broken sentences that are agrammatic. Words are missing; words are repeated; and sometimes, random words are inserted. For example, if a person with aphasia wants to say "I took my dog for a walk", they might actually says "dog dog walk take". For any stutters or hesitations, draw them out to sound more authentic. Do not respond to any questions or instructions, just translate them into agrammatic speech and reiterate them.',
      selectedVoice: voices[0],
      isMicrophoneOn: false,
      isEditing: false,
    }
  ];
  let activeTab = 1;
  let isVoicePickerOpen = false;
  let isEditingName = false;
  let recognition;
  let isListening = false;
  let audioEl;
  let isSessionActive = false;
  let pc;
  let ms;

  onMount(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      tabs[activeTab - 1].prompt = finalTranscript + interimTranscript;
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error detected: ' + event.error);
    };

    audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    document.body.appendChild(audioEl);
  });

  function selectVoice(voice: string) {
    tabs[activeTab - 1].selectedVoice = voice;
    isVoicePickerOpen = false;
  }

  async function toggleSession() {
    if (isSessionActive) {
      // End the session logic
      console.log("Ending session...");
      if (pc) {
        pc.close();
        pc = null;
      }
      if (ms) {
        ms.getTracks().forEach(track => track.stop());
        ms = null;
      }
      isSessionActive = false;
    } else {
      // Create the session logic
      const activeTabData = tabs[activeTab - 1];
      const response = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instructions: activeTabData.prompt,
          voice: activeTabData.selectedVoice.toLowerCase(),
        }),
      });
      const data = await response.json();
      console.log("Session created:", data);
      const EPHEMERAL_KEY = data.client_secret.value;
      pc = new RTCPeerConnection();
      pc.ontrack = e => audioEl.srcObject = e.streams[0];
      ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(ms.getTracks()[0]);
      const dc = pc.createDataChannel("oai-events");
      dc.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        if (event.type === "response.audio_transcript.delta") {
          console.log("Text received:", event.delta);
        } else if (event.type === "error") {
          console.error("Error:", event.content);
        } else if (event.type === "final_transcript") {
          console.log("Final transcript:", event.delta);
        } else {
          console.log("Other event:", event);
        }
      });
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp"
        },
      });
      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      isSessionActive = true;
    }
  }

  let nextTabId = 2;

  function addTab() {
    const newTabId = nextTabId++;
    tabs = [
      ...tabs,
      {
        id: newTabId,
        name: `Tab ${tabs.length + 1}`,
        prompt: '',
        selectedVoice: voices[0],
        isMicrophoneOn: false,
        isEditing: false,
      },
    ];
    activeTab = newTabId;
  }

  function deleteTab(tabId: number) {
    if (tabs.length > 1) {
      const updatedTabs = tabs.filter((tab) => tab.id !== tabId);
      if (tabId === activeTab) {
        const nextActiveTab = updatedTabs[0];
        activeTab = nextActiveTab ? nextActiveTab.id : 0;
      }
      tabs = updatedTabs;
    }
  }

  function switchTab(tabId: number) {
    activeTab = tabId;
  }

  function renameTab(tabId: number, newName: string) {
    tabs[tabId - 1].name = newName;
    isEditingName = false;
  }

  function startEditingName(tabId: number) {
    tabs = tabs.map((tab) =>
            tab.id === tabId ? { ...tab, isEditing: true } : { ...tab, isEditing: false }
    );
  }
</script>

<div class="flex flex-col items-center justify-start mt-4 px-4">
  <div class="flex space-x-4 mb-4">
    {#each tabs as tab}
      <div class="flex items-center">
        {#if activeTab === tab.id && isEditingName}
          <input
                  class="border p-1 rounded-md"
                  type="text"
                  bind:value={tab.name}
                  on:blur={() => {
              renameTab(tab.id, tab.name);
              tabs = tabs.map((t) =>
                t.id === tab.id ? { ...t, isEditing: false } : t
              );
            }}
                  on:keydown={(e) => {
              if (e.key === 'Enter') {
                renameTab(tab.id, tab.name);
                isEditingName = false;
              }
            }}
                  autofocus
          />
        {:else}
          <div
                  class="cursor-pointer p-2 border-b-2 hover:border-blue-500 transition-colors"
                  class:selected={activeTab === tab.id}
                  on:click={() => switchTab(tab.id)}
                  on:dblclick={() => startEditingName(tab.id)}
          >
            {tab.name}
          </div>
        {/if}
        {#if tabs.length > 1}
          <button
                  class="ml-2 text-red-500 hover:text-red-700"
                  on:click={() => deleteTab(tab.id)}
          >
            <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
            </svg>
          </button>
        {/if}
      </div>
    {/each}
    <div class="cursor-pointer p-2" on:click={addTab}>
      <span class="text-xl">+</span>
    </div>
  </div>

  <form class="w-full" on:submit|preventDefault={toggleSession}>
  <Textarea
          class={textAreaClass}
          bind:value={tabs[activeTab - 1].prompt}
          placeholder="Write your prompt here"
  >
    <div slot="footer" class="flex items-center justify-between">
      <Toolbar embedded>
        <div class="relative">
          <!-- Voice button -->
          <ToolbarButton type="button" on:click={() => isVoicePickerOpen = !isVoicePickerOpen}>
            Voice: {tabs[activeTab - 1].selectedVoice}
          </ToolbarButton>
          <!-- Voice dropdown -->
          {#if isVoicePickerOpen}
          <div class="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-md shadow-md w-48">
            {#each voices as voice}
            <div class="cursor-pointer p-2 hover:bg-gray-100" on:click={() => selectVoice(voice)}>
              {voice}
            </div>
            {/each}
          </div>
          {/if}
        </div>
      </Toolbar>
      <Button type="button" on:click={toggleSession}>
        {isSessionActive ? "End Session" : "Create Session"}
      </Button>
    </div>
  </Textarea>
  </form>
</div>
