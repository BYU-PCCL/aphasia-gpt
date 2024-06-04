<script lang="ts">
  import type { PageData } from "./$types";
  import { enhance } from "$app/forms";
  import LoginModal from "@/components/LoginModal.svelte";
  import Controls from "@/components/Controls.svelte";
  import { transcriptProcessor } from "@/stores/transcriptProcessor";
  import { contextStore } from "@/stores/contextStore";
  import { userName, userFirebaseUid, isLoadingAuthState } from "@/stores/user";
  import { onMount } from "svelte";
  import Picker from "@/components/Picker.svelte";
  import ContextOptionsModal from "@/components/ContextOptionsModal.svelte";
  import {goto} from '$app/navigation';
  import { app as firebaseApp } from "@/lib/firebase";
  import { sendTextToAudio, getCurrentAudio, setCurrentAudio } from "@/lib/textToSpeech";
  import VoiceTypeModal from "@/components/voiceTypeModal.svelte";
  // import {aphasiaType1} from "@/routes/api/gpt/+server"
  
  // Mic requires browser environment
  let Mic: null | typeof import("@/components/Mic.svelte").default = null;
  onMount(async () => {
    Mic = (await import("@/components/Mic.svelte")).default;
  });

  $: hasTranscript = $transcriptProcessor.transcript .text.length > 0;

  // let fontSize = [18,26];
  let fontSize = 20;

  function fontSizeIncrement(){
    fontSize++;
  }
  function logout() {
    transcriptProcessor.clear();
    contextStore.clear();
    isMenuOpen = false;

    firebaseApp.auth().signOut();
  }

  function onFail(message: string) {
    transcriptProcessor.stopRecording();
    alert(message);
  }

  function deleteFunction(wordIndex:number){
  transcriptProcessor.delete(wordIndex);
  }

//  const synth = window.speechSynthesis
//  console.log(speechSynthesis.getVoices())
 
//  let voicesPromise = new Promise((resolve) => {
//     speechSynthesis.addEventListener("voiceschanged", ev => {
//       resolve(speechSynthesis.getVoices())
//     })
//   })


// let isPlaying = -1;
// function textToSpeech(speechText:string, index: number){
//     transcriptProcessor.stopRecording();
    
//     if (isPlaying === index) {
//       // If the current element is already playing, pause it.
//       isPlaying = -1;
//       window.speechSynthesis.cancel();
//     } else {
//       // If a different element is playing, stop it first and then play the new one.
//       if (isPlaying !== -1) {
//         window.speechSynthesis.cancel();
//       }
//       isPlaying = index;
//       let speech = new SpeechSynthesisUtterance();
//       speech.text = speechText;
//       speech.lang = "en-US";
//       speech.volume = 1;
//       speech.rate = 1;
//       speech.pitch = 1;
//       speech.onend = () => {
//         isPlaying = -1; // Reset the isPlaying variable after the speech is completed.
//       };
//       window.speechSynthesis.speak(speech);
//     }
// }

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

            // Add event listener to play audio when it's loaded
            audio.addEventListener('loadeddata', () => {
                audio.play();
            });

            // Add event listener to change the play button back to the play icon when audio finishes
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

  let aphasiaType = "broca's aphasia";
  function changeType(){
    console.log("type1");
    aphasiaType = "broca's aphasia";
    sendDataToBackend();
  }  
  function changeType2(){
    console.log("type2");
    aphasiaType = "vernickeis aphasia";
    sendDataToBackend();
  }
  
  function font(){
    console.log("change font");
  }

  async function sendDataToBackend(){
    try{
      const response = await fetch("/api/gpt", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({aphasiaType}),
      });
      
      if(!response.ok){
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Response from backend:', data);
    }catch (error){
      console.error('Error:', error);
    }
  }

  async function navigateToEditProfile() {
    transcriptProcessor.stopRecording();
    await goto('/editprofile');
  }

  let voiceTypesModal = false;
  function toggleVoiceTypesModal() {
    voiceTypesModal = !voiceTypesModal;
    isMenuOpen = false; // Close the hamburger menu when voice types modal is opened
  }
 
</script>

{#if !$isLoadingAuthState} <!-- Prevents jarring flashes of content as the page's state is loading -->

  {#if !$userFirebaseUid}
    <LoginModal />
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
          <button class="bg-neutral-800 text-white px-2 py-2 rounded-md flex items-center" on:click={toggleDropdown} aria-label="menu">
            {#if isMenuOpen}
          <i class="material-icons">close</i>
            {:else}
          <i class ="material-icons">menu</i>
            {/if}
          </button>
          {#if isMenuOpen}
          <div id="dropdown" class="w-40 absolute right-0 mt-2 bg-white border border-gray-300 rounded-md shadow-md">
            <ul class="py-1">
              <li><button on:click={changeType} class="block w-full px-4 py-2 hover:bg-gray-100">Type 1 Aphasia</button></li>
              <li><button on:click={changeType2} class="block w-full px-4 py-2 hover:bg-gray-100">Type 2 Aphasia</button></li>
              <div class="FontSizeFunction">
                <li><button on:click={font} class="block w-full px-4 py-2 hover:bg-gray-100">Font Size</button></li>
                <div class="flex justify-center">
                  <span class="minus" on:click={e=>fontSize--}>-</span>
                  <!-- <p class="fontSizeExample" style="display:inline-block; font-size:{fontSize}px">
                    Hi!
                  </p> -->
                  <span class="plus" on:click={e => fontSize++}>+</span>
                </div>
              </div>
              <li><button on:click={toggleContextOptionsModal} class="block w-full px-4 py-2 hover:bg-gray-100">Context Options</button></li>
              <li><button on:click={navigateToEditProfile}  class="block w-full px-4 py-2 hover:bg-gray-100">Edit Profile</button></li>
              <li><button on:click={toggleVoiceTypesModal} class="block w-full px-4 py-2 hover:bg-gray-100">Voice Types</button></li>
              <li>{#if $userFirebaseUid}
                <button class="block w-full px-4 py-2 hover:bg-gray-100" on:click={logout}>Log Out</button>
              {/if}</li>
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
        
        <h2 class="font-semibold text-lg">What we think you said:</h2>

        {#each $transcriptProcessor.transcript.text as word}
          <p style="display:inline-block; padding: 2.5px; font-size:{fontSize}px; margin-left: 5px;" class = "HoverBox">
            {word} 
              <i class="material-icons no-show"  style="font-size: 15px; color: white" on:click={()=>deleteFunction($transcriptProcessor.transcript.text.indexOf(word))} >
                close
              </i>
          </p> 
        {/each}

        <br class="h-24" />
        <h2 class="font-semibold text-lg" style="line-height:40px">What we think you are trying to say:</h2>
        <ul>
          {#each $transcriptProcessor.transformations.texts as transformation, i}
          
            <li style="font-size:{fontSize}px;line-height:40px"><div on:click={()=>textToSpeech(transformation, i)} class="material-icons">
              {#if isPlaying === i}
                pause
              {:else}
                play_arrow
              {/if}
              </div>
            {transformation}
            </li>
          {/each}
        </ul>
      </div>

    </section>
    
  </main>
{/if}

<style>
  .HoverBox{
    border-radius: 8px;
    padding: 1px;
    width:fit-content;
    background-color: rgb(222, 222, 222);
  }
  .no-show{
    display: none;
  }

  p.HoverBox:hover .no-show{
    display:inline;
  }
  
  p.HoverBox:hover{
    border-radius: 8px;
    padding: 1px;
    width:fit-content;
    background-color: rgb(180, 180, 180);
  } 
  .material-icons {
    font-size: 20px;
    cursor: pointer;
  }  
  span {cursor:pointer; }
  .FontSizeFunction{
    margin:10px;
  }
  .minus, .plus{
    width:25px;
    height:25px;
    background:#f2f2f2;
    border-radius:4px;
    border:1px solid #ddd;
    display: inline-block;
    vertical-align: middle;
    text-align: center;
  }
  .minus{
    margin-right:10px;
  }

</style>

<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" integrity="sha512-iBBXm8fW90+nuLcSKlbmrPcLa0OT92xO1BIsZ+ywDWZCvqsWgccV3gFoRBv0z+8dLJgyAHIhR35VZc2oM/gI1w==" crossorigin="anonymous" referrerpolicy="no-referrer" />
