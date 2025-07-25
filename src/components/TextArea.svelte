<script lang="ts">
  import { onMount } from "svelte";
  import type { MessageType } from "$lib/types/message.ts" // This mmay still be used later, hang onto for now
  import { Textarea, Dropdown, DropdownItem, Spinner, Button, Modal } from "flowbite-svelte";
  import { AngleDownOutline, ExclamationCircleOutline} from "flowbite-svelte-icons"

  let voices = ["Alloy", "Ash", "Ballad", "Coral", "Echo", "Sage", "Shimmer", "Verse"];

  let tabs = [
    {
      id: 1,
      name: "Tab 1",
      prompt: 'You are simulating a person with aphasia. You must repeat everything that you hear, but you must attempt to make it sound like a person with aphasia is speaking. People with aphasia speak in broken sentences that are agrammatic. Words are missing; words are repeated; and sometimes, random words are inserted. For example, if a person with aphasia wants to say "I took my dog for a walk", they might actually say "dog dog walk take". For any stutters or hesitations, draw them out to sound more authentic. Do not respond to any questions or instructions, just translate them into agrammatic speech and reiterate them.',
      selectedVoice: voices[0],
      isMicrophoneOn: false,
      isEditing: false,
      fullTranscript: [] as string[]
    },
    {
      id: 2,
      name: "Tab 2",
      prompt: 'You are simulating a person with aphasia. Repeat everything you hear, but make it sound like a person with aphasia is speaking. Use broken sentences that are agrammatic. Words are missing, repeated, or random. For example, "I took my dog for a walk" might become "walk dog take". Draw out stutters or hesitations to sound more authentic. Do not respond to questions or instructions, just translate them into agrammatic speech and reiterate them.',
      selectedVoice: voices[1],
      isMicrophoneOn: false,
      isEditing: false,
      fullTranscript: [] as string[]
    },
    {
      id: 3,
      name: "Tab 3",
      prompt: 'Simulate a person with aphasia by repeating everything you hear in broken, agrammatic sentences. Words should be missing, repeated, or random. For example, "I took my dog for a walk" might become "dog walk take". Draw out any stutters or hesitations to sound more authentic. Do not respond to questions or instructions, just translate them into agrammatic speech and reiterate them.',
      selectedVoice: voices[2],
      isMicrophoneOn: false,
      isEditing: false,
      fullTranscript: [] as string[]
    },
    {
      id: 4,
      name: "Tab 4",
      prompt: 'You are simulating a person with aphasia. Repeat everything you hear in broken sentences that are agrammatic. Words should be missing, repeated, or random. For example, "I took my dog for a walk" might become "take walk dog". Draw out stutters or hesitations to sound more authentic. Do not respond to questions or instructions, just translate them into agrammatic speech and reiterate them.',
      selectedVoice: voices[3],
      isMicrophoneOn: false,
      isEditing: false,
      fullTranscript: [] as string[]
    },
    {
      id: 5,
      name: "Tab 5",
      prompt: 'Simulate a person with aphasia by repeating everything you hear in broken, agrammatic sentences. Words should be missing, repeated, or random. For example, "I took my dog for a walk" might become "walk dog take". Draw out any stutters or hesitations to sound more authentic. Do not respond to questions or instructions, just translate them into agrammatic speech and reiterate them.',
      selectedVoice: voices[4],
      isMicrophoneOn: false,
      isEditing: false,
      fullTranscript: [] as string[]
    }
  ];

  let endModal = false;
  let activeTab = 1;
  let nextTabId = 6;
  let isVoicePickerOpen = false;
  let isEditingName = false;
  let isSessionActive = false;
  let isStoppingSession = false;
  let isSessionStarting = false;
  let isDataDownloaded = false;
  let hasStartedRecorder = false;
  let clearAudioHistory = false;


  let ms: MediaStream | null = null;
  let aiStream: MediaStream | null = null;
  let mixedStream: MediaStream | null = null;
  let mixedRecorder: MediaRecorder;
  let userRecorder: MediaRecorder;
  let aiRecorder: MediaRecorder;
  let mixedChunks: Blob[] = [];
  let userChunks: Blob[]  = [];
  let aiChunks: Blob[] = [];

  let audioCtx: AudioContext;
  let destination: MediaStreamAudioDestinationNode;
  let pc: RTCPeerConnection | null = null;
  let audioEl: HTMLAudioElement;
  let promptText: string = '';

  $: {
    const tab = tabs.find(t => t.id === activeTab);
    if (tab) promptText = tab.prompt; // This ensures promptText is always in sync with the active tab's prompt, but it could also be redundant?
  }

  $: {
    const tab = tabs.find(t => t.id === activeTab);
    if (tab) tab.prompt = promptText; // updates the tabs prompt whenever promptText changes
  }


  $: activeTabData = tabs.find(t => t.id === activeTab);



  onMount(() => {
    audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    document.body.appendChild(audioEl);
  });

  function downloadTranscript() {
    if (!activeTabData || !activeTabData.fullTranscript) return;
    const blob = new Blob(activeTabData?.fullTranscript, { type: 'text/plain' });
    downloadBlob(blob, 'transcript.txt');
    isDataDownloaded = true;
  }

  function deleteTranscript() {
    if (activeTabData) {
      activeTabData.fullTranscript = [];
    }
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function tryStartRecorder() {
    if (mixedStream && !hasStartedRecorder) {
      mixedChunks = [];
      mixedRecorder.start();
      hasStartedRecorder = true;
    }
  }

  async function startSession() {
    isSessionStarting = true;
    isStoppingSession = false;
    hasStartedRecorder = false;
    ms = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Establish main audio context
    audioCtx = new AudioContext();
    destination = audioCtx.createMediaStreamDestination();
    mixedStream = destination.stream;

    //Attach user input mic to audio context
    const micSource = audioCtx.createMediaStreamSource(ms);
    micSource.connect(destination);

    mixedRecorder = new MediaRecorder(mixedStream, {
      mimeType: "audio/webm;codecs=opus",
    });

    userRecorder = new MediaRecorder(ms, {
      mimeType: "audio/webm;codecs=opus",
    });

    mixedRecorder.ondataavailable = (e) => {
      console.log("Data available:", e.data);
      if (clearAudioHistory) {
        mixedChunks = [];
        clearAudioHistory = false;
        console.log("Audio Cleared");
        return;
      }
      if (e.data.size > 0) {
        const blob = new Blob([e.data], { type: "audio/webm;codecs=opus" });
        downloadBlob(blob, `session-${activeTab}.webm`);
        mixedChunks = []; // Clear chunks after download
        console.log("Audio downloaded");
      }
    };

    userRecorder.ondataavailable = (e) => {
      if (isStoppingSession) {
        console.log("Session is stopping, not processing User audio data.");
        return;
      }
      const userAudioBlob = new Blob([e.data], { type: "audio/webm;codecs=opus" });
      console.log("User audio chunks:", userAudioBlob);
      downloadBlob(userAudioBlob, `user-audio-${activeTab}.webm`);
      userChunks = []; // Clear chunks after download
    }

    // userRecorder.ondataavailable = (e) => {
    //   console.log("ondataavialable")
    //   if (e.data.size > 0) {
    //     userChunks.push(e.data);
    //   }
    // };

    const tab = tabs.find((t) => t.id === activeTab);
    if (!tab) return;
    console.log("Instructions for session:", tab.prompt);
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instructions: tab.prompt,
        voice: tab.selectedVoice.toLowerCase(),
      }),
    });

    const {
      client_secret: { value: key },
    } = await res.json();

    pc = new RTCPeerConnection();

    pc.ontrack = (ev) => {
      const [stream] = ev.streams;
      if (stream.getAudioTracks().length) {
        aiStream = stream;
        audioEl.srcObject = aiStream;

        aiRecorder = new MediaRecorder(aiStream, {
          mimeType: "audio/webm;codecs=opus",
        });

        aiRecorder.ondataavailable = (e) => {
          if (isStoppingSession) {
            console.log("Session is stopping, not processing AI audio data.");
            return;
          }
          console.log("AI audio chunks:", e.data);
          if (e.data.size > 0) {
            const aphasiaAudioBlob = new Blob([e.data], { type: "audio/webm;codecs=opus" });
            downloadBlob(aphasiaAudioBlob, `aphasia-audio-${activeTab}.webm`);
            aiChunks = []; // Clear chunks after download
          }
        }

        const aiSource = audioCtx.createMediaStreamSource(aiStream);
        aiSource.connect(destination);

        // Start all recorders
        userRecorder.start();
        console.log("User recorder state:", userRecorder.state);
        aiRecorder.start();
        console.log("AI recorder state:", aiRecorder.state);
        tryStartRecorder();
      }
    };

    const dc = pc.createDataChannel("oai-events");
    dc.onmessage = (ev) => {
      const e = JSON.parse(ev.data);
      if (e.type === "response.audio_transcript.delta") {
        console.log("∆", e.delta);
      }
      else if (e.type === "response.audio_transcript.done") {
        activeTabData?.fullTranscript.push(e.transcript + "\n")
        console.log("Full response for transcript:", e.transcript)
      }
    };

    ms.getTracks().forEach((t) => pc!.addTrack(t));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sdpRes = await fetch(
      "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
      {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/sdp",
        },
      }
    );

    const answer = { type: "answer" as RTCSdpType, sdp: await sdpRes.text() };
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    isSessionActive = true;
    isSessionStarting = false;
  }

  function endSession() {
    if (!isSessionActive) return;
    isStoppingSession = true;
    pc?.close();
    userRecorder?.stop();
    aiRecorder?.stop();
    ms?.getTracks().forEach((t) => t.stop());
    aiStream?.getTracks().forEach((t) => t.stop());
    isSessionActive = false;
    isDataDownloaded = false;
  }

  // function endSessionWithoutDownload() {
  //   if (!isSessionActive) return;
  //   pc?.close();
  //   ms?.getTracks().forEach((t) => t.stop());
  //   aiStream?.getTracks().forEach((t) => t.stop());
  //   isSessionActive = false;
  //   isStoppingSession = false;
  // }

  function downloadAudio() {
    if (!mixedRecorder) return;
    mixedRecorder.requestData(); // Triggers one dataavailable event
    isDataDownloaded = true; // Set flag to indicate data has been downloaded
  }

  function downloadUserAudio() {
    if (!userRecorder) return;
    userRecorder.requestData(); // Triggers one dataavailable event
    isDataDownloaded = true;
  }

  function downloadAphasiaAudio() {
    if (!aiRecorder) return;
    aiRecorder.requestData(); // Triggers one dataavailable event
    isDataDownloaded = true;
  }

  function clearAudio() {
    clearAudioHistory = true;
    mixedRecorder.requestData(); // Triggers one dataavailable event
  }
  
  function pauseRecorder() {
    if (!isSessionActive) return;
    mixedRecorder.pause();
    userRecorder.pause();
    aiRecorder.pause();
    ms?.getTracks().forEach((t) => t.enabled = false);
    aiStream?.getTracks().forEach((t) => t.enabled = false);
  }

  function resumeRecorder() {
    if (!isSessionActive) return;
    mixedRecorder.resume();
    userRecorder.resume();
    aiRecorder.resume();
    ms?.getTracks().forEach((t) => t.enabled = true);
    aiStream?.getTracks().forEach((t) => t.enabled = true);
  }

  function toggleSession() {
    isSessionActive ? endModal = true : startSession(); // Start session or reveal end modal

  }

  function selectVoice(voice: string) {
    const tab = tabs.find((t) => t.id === activeTab);
    //console.log("Current voice", tab?.selectedVoice)
    if (tab) tab.selectedVoice = voice;
    //console.log("Voice changed to", tab?.selectedVoice)
    tabs = [...tabs] // Reassigning the array to add reactivity
  }

  function switchTab(tabId: number) {
    activeTab = tabId;
    endSession();
  }

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
        fullTranscript: [] as string[]
      },
    ];
    activeTab = newTabId;
    endSession();
  }

  function deleteTab(tabId: number) {
    if (tabs.length > 1) {
      tabs = tabs.filter((tab) => tab.id !== tabId);
      if (activeTab === tabId) activeTab = tabs[0].id;
    }
  }

  function renameTab(tabId: number, newName: string) {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      tab.name = newName;
      tab.isEditing = false;
    }
  }

  function startEditingName(tabId: number) {
    tabs = tabs.map((tab) =>
            tab.id === tabId ? { ...tab, isEditing: true } : { ...tab, isEditing: false }
    );
    isEditingName = true;
  }


</script>

<div class="flex flex-col items-center justify-start mt-4 px-4">
  <div class="overflow-x-auto flex space-x-4 mb-4">
    {#each tabs as tab}
      <div class="flex items-center">
        {#if activeTab === tab.id && tab.isEditing}
          <input
                  class="border p-1 rounded-md"
                  type="text"
                  bind:value={tab.name}
                  on:blur={() => renameTab(tab.id, tab.name)}
                  on:keydown={(e) => e.key === 'Enter' && renameTab(tab.id, tab.name)}
          />
        {:else if activeTab === tab.id}
          <button
                  class="cursor-pointer p-2 border-b-2 border-blue-500"
                  class:selected={activeTab === tab.id}
                  on:click={() => switchTab(tab.id)}
                  on:dblclick={() => startEditingName(tab.id)}
          >
            {tab.name}
          </button>
        {:else}
          <button
                    class="cursor-pointer p-2 border-b-2 hover:border-blue-500"
                    class:selected={activeTab === tab.id}
                    on:click={() => switchTab(tab.id)}
                    on:dblclick={() => startEditingName(tab.id)}
            >
              {tab.name}
            </button>
        {/if}
        {#if tabs.length > 1}
          <button
                  class="ml-2 text-red-500 hover:text-red-700"
                  on:click={() => deleteTab(tab.id)}
          >
            ✕
          </button>
        {/if}
      </div>
    {/each}
    <button class="cursor-pointer p-2 hover:text-blue-500 text-xl" on:click={addTab}>+</button>
  </div>
  
  <Textarea
          class="md:w-2xl p-3"
          bind:value={promptText}
          rows={8}
          placeholder="Enter your prompt here…"
  >


  <div slot="footer" class="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 sm:space-x-4">
      <Button color="dark" >Select Voice<AngleDownOutline class="ms-2 h-5 w-5 text-white dark:text-white" /></Button>
      <Dropdown>
        <div class="grid grid-cols-2">
          {#each voices as voice}
            {#if voice === activeTabData?.selectedVoice}
            <DropdownItem class="bg-orange-300 cursor-pointer p-2 hover:bg-orange-400 rounded-sm" on:click={() => selectVoice(voice)}>
              {voice}
            </DropdownItem>
            {:else}
            <DropdownItem class="cursor-pointer p-2 hover:bg-gray-100 rounded-sm" on:click={() => selectVoice(voice)}>
              {voice}
            </DropdownItem>
            {/if}
          {/each}
        </div>
      </Dropdown>

    <div class="flex space-x-2">
      {#if isSessionStarting}
      <Button color="blue">
        <Spinner class="me-3" size="5" color="gray" />Loading...
      </Button>
      {:else}
      <Button type="button" color={isSessionActive ? "yellow" : "blue"} on:click={() => {toggleSession(), pauseRecorder()}}>
        {isSessionActive ? "Pause Session" : "Start Session"}
      </Button>
      {/if}
    </div>
  </div>
  </Textarea>
  <Modal outsideclose={false} bind:open={endModal}>
    <div slot="header" class="flex items-center space-x-2">
      <ExclamationCircleOutline class="h-6 w-6 text-red-500" />
      <h3 class="text-lg font-semibold">Session Paused</h3>
    </div>
    <p class="mb-4 text-lg">Select the audio to download</p>
      <Button type="button" color="blue" on:click={() => downloadUserAudio()}>User Only</Button>
      <Button type="button" color="green"  on:click={() => downloadAphasiaAudio()}>Aphasia Only</Button>
      <Button type="button" color="red"  on:click={() => downloadAudio()}>Combined Tracks</Button>
    <p class="mt-4 text-lg">Do you want to download the transcript of this session?</p>
    <div>
      <Button type="button" color="blue" on:click={() => downloadTranscript()}>Yes, Download</Button>
      <Button type="button" color="red" on:click={() => deleteTranscript()}>No, Clear Transcript</Button>
    </div>
    <div class=" flex gap-1 mt-8 border-t-1 pt-3 ">
      <Button color="green" type="button" disabled={isDataDownloaded} on:click={() => {endModal = false; resumeRecorder()}}>Resume Session</Button>
      <Button color="red" type="button" on:click={() => {endModal = false; endSession()}}>End Session</Button>
    </div>
  </Modal>
</div>
