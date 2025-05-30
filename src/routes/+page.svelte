<script lang="ts">
  export let data;
  import LoginModal from "@/components/LoginModal.svelte";
  import Controls from "@/components/Controls.svelte";
  import { transcriptProcessor } from "@/stores/transcriptProcessor";
  import { contextStore } from "@/stores/contextStore";
  import { userName, userFirebaseUid, isLoadingAuthState } from "@/stores/user";
  import { onMount } from "svelte";
  import Picker from "@/components/Picker.svelte";
  import ContextOptionsModal from "@/components/ContextOptionsModal.svelte";
  import { app as firebaseApp } from "@/lib/firebase";
  import { sendTextToAudio, getCurrentAudio, setCurrentAudio } from "@/lib/textToSpeech";
  import VoiceTypeModal from "@/components/VoiceTypeModal.svelte";
  import EditProfile from "@/components/EditProfile.svelte";
  import { homophonesStore } from "@/stores/homophonesStore"; // Import homophonesStore
  import { get } from 'svelte/store';
  import { onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import EditTranscript from "@/components/EditTranscript.svelte";


  // import {aphasiaType1} from "@/routes/api/gpt/+server"
  let Mic: null | typeof import("@/components/Mic.svelte").default = null;
  // Mic requires browser environment
  onMount(async () => {
    
  if (browser) {
    
    Mic = (await import("@/components/Mic.svelte")).default;

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
  }
});

onDestroy(() => {
  if (browser) {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('touchstart', handleClickOutside);
  }
});


  $: hasTranscript = $transcriptProcessor.transcript .text.length > 0;

  // let fontSize = [18,26];
  let fontSize = 20;
  //Homophone correct position
  let dropdownPosition = { top: '0px', left: '0px' };


  function fontSizeIncrement(){
    fontSize++;
  }

  async function logout() {
  try {
    transcriptProcessor.clear();
    contextStore.clear();
    isMenuOpen = false;
    if (firebaseApp.auth) {
      await firebaseApp.auth().signOut();
    }
  } catch (error) {
    console.error("Failed to sign out:", error);
  }
}
  let isEditing = false;
  function openEditModal() {
    isEditing = true;
  }

// this is for updating the text
  function handleSave(event) {
    console.log("Event received:", event); // Debugging log

    const updatedText = event.detail; // Fix: Extract correctly

    if (typeof updatedText !== "string") {
      console.error("handleSave received non-string value:", updatedText);
      return; // Prevent errors
    }

    console.log("Saving transcript:", updatedText);
    transcriptProcessor.updateTranscript(updatedText);
  }





  function onFail(message: string) {
    transcriptProcessor.stopRecording();
    alert(message);
  }

  function deleteFunction(wordIndex:number){
    // console.log("in delete function");
    transcriptProcessor.delete(wordIndex);
  }

  function replaceWord(index: number, newWord: string) {
    transcriptProcessor.delete(index);
  }


// Function to get homophones for a given word
  function getHomophones(word: string) {
    const homophonesDict = get(homophonesStore);
    return homophonesDict[word] || [];
  }

  let hoveredIndex: number | null = null;
  let hoveredIndexHomophone: string | null = null;


  let isPlaying = -1;

  async function textToSpeech(speechText: string, index: number) {
    transcriptProcessor.stopRecording();

    if (isPlaying === index) {
        const audio = getCurrentAudio();
        if (audio) {
            audio.pause();
            isPlaying = -1;
        }
    } else {
        try {
            const audio = await sendTextToAudio(speechText);
            setCurrentAudio(audio);
            isPlaying = index;

            // Preload audio to ensure it's ready to play
            audio.preload = 'auto';

            // Ensure the audio plays on user interaction
            audio.play().catch((error) => {
                // console.log("Playback prevented:", error);
            });

            audio.addEventListener('canplaythrough', () => {
                audio.play();
            });

            audio.addEventListener('ended', () => {
                isPlaying = -1;
            });

        } catch (error) {
            console.error("Error:", error);
        }
    }
}

  let isMenuOpen = false;
  function toggleDropdown() {
    isMenuOpen = !isMenuOpen;
  }

  let contextOptionsModal = false;
  function toggleContextOptionsModal() {
    contextOptionsModal = !contextOptionsModal;
    isMenuOpen = false;
    if ($transcriptProcessor.isRecording) {
      transcriptProcessor.toggleRecording();
    }
    if (!contextOptionsModal) {
      contextStore.clearForm();
    }
  }
  
  function font(){
    // console.log("change font");
  }
  let editProfile = false;
  function toggleEditProfile() {
    editProfile = !editProfile;
    isMenuOpen = false;
  }

  let voiceTypesModal = false;
  function toggleVoiceTypesModal() {
    voiceTypesModal = !voiceTypesModal;
    isMenuOpen = false; // Close the hamburger menu when voice types modal is opened
  }

  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let isFlicking = false;
  let currentWordIndex: number | null = null;

  function handleFlickStart(event: MouseEvent | TouchEvent, index: number) {
    event.preventDefault();

    const touch = event instanceof TouchEvent ? event.touches[0] : event;
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = event.timeStamp;
    isFlicking = true;
    currentWordIndex = index;
    const endHandler = (e: MouseEvent | TouchEvent) => handleFlickEnd(e);
    document.addEventListener('mouseup', handleFlickEnd, { once: true });
    document.addEventListener('touchend', handleFlickEnd, { once: true });


  }

  function handleFlickEnd(event: MouseEvent | TouchEvent) {
    if (!isFlicking) return;

    const touch = event instanceof TouchEvent ? event.changedTouches[0] : event;
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = event.timeStamp;

    const diffX = endX - startX;
    const diffY = endY - startY;
    const duration = endTime - startTime;
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);

    // Threshold values for distinguishing between a tap and a flick
    const tapThresholdDistance = 10; // Allowable movement for a tap (in pixels)
    const tapThresholdDuration = 300; // Maximum duration for a tap (in milliseconds)

    if (distance < tapThresholdDistance && duration < tapThresholdDuration) {
        // It's a tap! Show homophones.
        if (currentWordIndex !== null) {
            const word = $transcriptProcessor.transcript.text[currentWordIndex];
            const homophones = getHomophones(word);
            if (homophones.length > 0) {
                hoveredIndex = currentWordIndex; // Set the hovered index to show homophones
                const target = event.target as HTMLElement;
                if (target) {
                    const rect = target.getBoundingClientRect();
                    dropdownPosition = { 
                        top: `${rect.bottom + window.scrollY}px`, 
                        left: `${rect.left + window.scrollX}px` 
                    };
                }
            }
        }
    } else if (distance > 20 && duration < 5000 && currentWordIndex !== null) {
        // It's a flick! Delete the word.
        deleteFunction(currentWordIndex);
    }
    isFlicking = false;
    currentWordIndex = null;
}
function hideHomophones() {
  hoveredIndex = null;
  dropdownPosition = { top: '0px', left: '0px' };
}
function handleClickOutside(event: MouseEvent | TouchEvent) {
    const target = event.target as HTMLElement;
    const homophonePopup = document.querySelector('.homophones-popup');

    // Check if the click/tap is outside the homophone popup
    if (hoveredIndex !== null && homophonePopup && !homophonePopup.contains(target)) {
      hideHomophones();
    }
  }

  function getProfileData() {
    // console.log("Profile Data:", data);
    return data;
  }




  

 
</script>

{#if !$isLoadingAuthState} <!-- Prevents jarring flashes of content as the page's state is loading -->

  {#if !$userFirebaseUid}
    <LoginModal />
  {/if}

  {#if editProfile}
  <EditProfile toggleEditProfile={toggleEditProfile} />
  {/if}


  {#if voiceTypesModal}
    <VoiceTypeModal toggleVoiceTypesModal={toggleVoiceTypesModal} />
  {/if}

  {#if contextOptionsModal}
    <ContextOptionsModal toggleModal={toggleContextOptionsModal} />
  {/if}

  <main>
    
    <header class="flex justify-between items-center px-2 md:px-4 py-2 mb-8">
      <h1 class="block font-bold text-lg sm:text-2xl">Aphasia GPT</h1>
      <div class="flex items-center">
        {#if $userName}
          <div class="text-sm sm:text-base mr-1 md:mr-3">Hi {$userName} 👋</div>
        {/if}
        <!-- This is the dropdown menu -->
        <div class="relative z-30">
          <button class="hamburger-button" on:click={toggleDropdown} aria-label="menu">
            {#if isMenuOpen}
          <i class="material-icons hamburger-icon">close</i>
            {:else}
          <i class ="material-icons hamburger-icon">menu</i>
            {/if}
          </button>
          {#if isMenuOpen}
            <div id="dropdown" role="menu" class="w-40 absolute right-0 mt-2 bg-white border border-gray-300 rounded-md shadow-md">
              <ul class="py-1">
                <div class="FontSizeFunction">
                  <li role="none">
                    <button on:click={font} class="block w-full px-4 py-2 hover:bg-gray-100" role="menuitem" aria-haspopup="true">Font Size</button>
                  </li>
                  <div class="flex justify-center">
                    <span class="minus" role="button" tabindex="0" on:click={e => fontSize--} on:keydown={(e) => e.key === 'Enter' && fontSize--}>-</span>
                    <span class="plus" role="button" tabindex="0" on:click={e => fontSize++} on:keydown={(e) => e.key === 'Enter' && fontSize++}>+</span>
                  </div>
                </div>
                <li role="none">
                  <button on:click={toggleContextOptionsModal} class="block w-full px-4 py-2 hover:bg-gray-100" role="menuitem">Context Options</button>
                </li>
                <li role="none">
                  <button on:click={toggleEditProfile} class="block w-full px-4 py-2 hover:bg-gray-100" role="menuitem">Edit Profile</button>
                </li>
                <li role="none">
                  <button on:click={toggleVoiceTypesModal} class="block w-full px-4 py-2 hover:bg-gray-100" role="menuitem">Voice Types</button>
                </li>
                <li role="none">
                  {#if $userFirebaseUid}
                    <button class="block w-full px-4 py-2 hover:bg-gray-100" on:click={logout} role="menuitem">Log Out</button>
                  {/if}
                </li>
                <!-- Add more options as needed -->
              </ul>
            </div>
          {/if}
          
        </div>
      </div>
    </header>

    {#if Mic !== null}
      <svelte:component this={Mic}
        isRecording={$transcriptProcessor.isRecording}
        {onFail}
        onChange={transcriptProcessor.addTranscriptChunk}
      />
    {/if}
      
    <section class="max-w-2xl mx-auto px-4">
      <Controls
        isRecording={$transcriptProcessor.isRecording}
        {hasTranscript}
        toggleRecording={transcriptProcessor.toggleRecording}
        onBack={transcriptProcessor.back}
        onNew={transcriptProcessor.clear}
        />
        
      <div class="flex justify-center mt-6">
        <div class="w-1/3 flex justify-center">
          <Picker title={$contextStore.settingContext.contextTitle} bind:selectedItem={$contextStore.settingContext.selection} options={$contextStore.settingContext.options} />
        </div>
        <div class="w-1/3 flex justify-center">
          <Picker title={$contextStore.typeContext.contextTitle} bind:selectedItem={$contextStore.typeContext.selection} options={$contextStore.typeContext.options} />
        </div>
        <div class="w-1/3 flex justify-center">
          <Picker title={$contextStore.toneContext.contextTitle} bind:selectedItem={$contextStore.toneContext.selection} options={$contextStore.toneContext.options} />
        </div>
      </div>

      <div class="mt-12">
        <div class="flex items-center justify-between w-full">
          <h2 class="font-semibold text-lg">What we think you said:</h2>
          <button on:click={openEditModal} class="edit-icon">
            <i class="material-icons">edit</i>
          </button>
        </div>
        

        {#if isEditing}
          <EditTranscript
                  transcript={$transcriptProcessor.transcript.text.join(" ")}
                  on:save={handleSave}
                  on:close={() => isEditing = false}
          />
        {/if}




        {#each $transcriptProcessor.transcript.text as word, index}
          <p
            style="display:inline-block; padding: 2.5px; font-size:{fontSize}px;"
            class="HoverBox word-{index}"
            on:mouseenter={(event) => {
              hoveredIndex = index;
              const target = event.target;
              if (target instanceof HTMLElement) { // Check if it's an HTMLElement
                const rect = target.getBoundingClientRect();
                dropdownPosition = { 
                  top: `${rect.bottom + window.scrollY}px`, 
                  left: `${rect.left + window.scrollX}px` 
                };
              }
            }}
            on:mouseleave={() => hoveredIndex = null} 
            on:mousedown={(event) => handleFlickStart(event, index)}
            on:touchstart={(event) => handleFlickStart(event, index)}
          >
            {word}

          {#if hoveredIndex === index && getHomophones(word).length > 0}
            <div class="homophones-popup" style="top: {dropdownPosition.top}; left: {dropdownPosition.left};">
              {#each getHomophones(word) as homophone (homophone)}
                <button
                  class="homophone px-2 py-1 bg-gray-200 rounded-md hover:bg-gray-300 transition"
                  on:mouseenter={() => hoveredIndexHomophone = homophone}
                  on:mouseleave={() => hoveredIndexHomophone = null}
                  on:click={() => {
                    transcriptProcessor.replace(index, homophone);
                    hoveredIndex = null;
                  }}
                >
                  {@html homophone}
                </button>
              {/each}
            </div>
          {/if}


          </p>
        {/each}

        <br class="h-24" />
        <h2 class="font-semibold text-lg" style="line-height:40px">What we think you are trying to say:</h2>
        <ul>
  {#each $transcriptProcessor.transformations.texts as transformation, i}
    <li style="font-size:{fontSize}px; line-height:40px">
      <button 
        on:click={() => textToSpeech(transformation, i)} 
        class="material-icons" 
        aria-label={isPlaying === i ? "Pause" : "Play"}
      >
        {#if isPlaying === i}
          pause
        {:else}
          play_arrow
        {/if}
      </button>
      {transformation}
    </li>
  {/each}
</ul>

      </div>

    </section>
    
  </main>
{/if}

<style>

.hamburger-button {
  background: none; /* No background */
  border: none; /* No border */
  padding: 0; /* No padding */
  margin: 0; /* No margin */
  display: flex; /* Flexbox for centering */
  align-items: center; 
  justify-content: center;
  cursor: pointer; /* Pointer cursor */
}

.hamburger-icon {
  color: black;
  font-size: 32px !important; /* Adjust size as needed */
  line-height: 1; /* Ensure no extra height */
}

.hamburger-icon:hover {
  color: darkgrey; /* Optional hover effect */
}

header div {
  margin: 0; /* Ensure no margin from parent */
  padding: 0; /* Ensure no padding from parent */
}



.HoverBox {
  user-select: none;
  border-radius: 8px;
  padding: 1px;
  width: fit-content;
  background-color: rgb(222, 222, 222);
  display: inline-block; /* Keep words inline */
  margin-right: 5px; /* Horizontal spacing for words */
}

  .no-show {
    display: none;
  }

  p.HoverBox:hover {
    border-radius: 8px;
    padding: 1px;
    width: fit-content;
    background-color: rgb(180, 180, 180);
  }

  .material-icons {
    font-size: 20px;
    cursor: pointer;
  }

  span {
    cursor: pointer;
  }

  .FontSizeFunction {
    margin: 10px;
  }

  .minus, .plus {
    width: 25px;
    height: 25px;
    background: #f2f2f2;
    border-radius: 4px;
    border: 1px solid #ddd;
    display: inline-block;
    vertical-align: middle;
    text-align: center;
  }

  .minus {
    margin-right: 10px;
  }

  .homophones-popup {
    position: absolute;
    display: block; /* Display homophones as a vertical list */
    background-color: white;
    border: 1px solid #ccc;
    padding: 5px;
    border-radius: 4px;
  }
  .hovered-word {
    font-weight: bold;
    color: #1E90FF; /* Same blue color when hovering */
}

.edit-button {
    background-color: #4CAF50;
    color: white;
    padding: 8px 12px;
    border: none;
    cursor: pointer;
    margin-bottom: 10px;
    border-radius: 5px;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
    width: 400px;
    max-width: 90%;
    text-align: center;
  }

  .modal h2 {
    margin-bottom: 10px;
  }

  .modal textarea {
    width: 100%;
    height: 100px;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 10px;
    font-size: 16px;
  }

  .modal-buttons {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
  }

  .save-button, .cancel-button {
    padding: 8px 12px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }

  .save-button {
    background-color: #4CAF50;
    color: white;
  }

  .cancel-button {
    background-color: #ccc;
  }

  .homophones-popup:before {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    top: -5px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    background-color: #f3f4f6;
    border: 1px solid #ccc;
    z-index: -1;
  }

  .homophone {
    display: block; /* Make each homophone take its own line */
    margin-bottom: 5px; /* Add space between homophones */
  }

  .homophone:hover {
    background-color: #e2e8f0;
  }
    .edit-icon {
    font-size: 22px;
    cursor: pointer;
    color: gray;
    transition: color 0.3s;
    border: none;
    background: none;
    padding: 5px;
  }

  .edit-icon:hover {
    color: black;
  }

</style>

<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" integrity="sha512-iBBXm8fW90+nuLcSKlbmrPcLa0OT92xO1BIsZ+ywDWZCvqsWgccV3gFoRBv0z+8dLJgyAHIhR35VZc2oM/gI1w==" crossorigin="anonymous" referrerpolicy="no-referrer" />
