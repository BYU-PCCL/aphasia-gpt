<script lang="ts">
  import type { PageData } from "./$types";
  import { enhance } from "$app/forms";
  import LoginModel from "@/components/LoginModel.svelte";
  import Controls from "@/components/Controls.svelte";
  import { transcriptProcessor } from "@/stores/transcriptProcessor";
  import { username } from "@/stores/user";
  import { onMount } from "svelte";
  import { findIndex, indexOf, words } from "lodash";

  
  // import {aphasiaType1} from "@/routes/api/gpt/+server"
  


  // Mic requires browser environment
  let Mic: null | typeof import("@/components/Mic.svelte").default = null;
  onMount(async () => {
    Mic = (await import("@/components/Mic.svelte")).default;
  });

  export let data: PageData;
  $: {
    $username = data.username;
  }
  $: hasTranscript = $transcriptProcessor.transcript !== " ";

  let fontSize = 18;
  const minFontSize = 10;
  const maxFontSize = 26;

  function fontSizeBigger(){
    if(fontSize < maxFontSize){
      fontSize ++;
    }
  }

  function fontSizeSmaller(){
    if(fontSize > minFontSize){
      fontSize --;
    }
  }

  function logout() {
    transcriptProcessor.clear();
    $username = null;
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

let isPlaying = -1;
function textToSpeech(speechText:string, index: number){
    transcriptProcessor.stopRecording();
    
    if (isPlaying === index) {
      // If the current element is already playing, pause it.
      isPlaying = -1;
      window.speechSynthesis.cancel();
    } else {
      // If a different element is playing, stop it first and then play the new one.
      if (isPlaying !== -1) {
        window.speechSynthesis.cancel();
      }
      isPlaying = index;
      let speech = new SpeechSynthesisUtterance();
      speech.text = speechText;
      speech.lang = "en-US";
      speech.volume = 1;
      speech.rate = 1;
      speech.pitch = 1;
      speech.onend = () => {
        isPlaying = -1; // Reset the isPlaying variable after the speech is completed.
      };
      window.speechSynthesis.speak(speech);
    }
}

 //drop down logic
  let isMenuOpen = false;
  function toggleDropdown(event: MouseEvent) {
    event.preventDefault();
    const dropdown = document.getElementById("dropdown");
    if (dropdown) {
      dropdown.classList.toggle("hidden");
      isMenuOpen = !isMenuOpen;
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
 

</script>

<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">

{#if !$username}
  <LoginModel />
{/if}

<main>
  <header class="flex justify-between items-start px-4 py-2 mb-4">
    <h1 class="block font-bold text-2xl mb-4">Aphasia GPT</h1>

    {#if $username}
      <form method="POST" action="/?/logout" use:enhance={logout} class="flex items-baseline gap-4">
        <div>Hi {$username} 👋</div>
      </form>
    {/if}
    <!-- This is the dropdown menu -->
    <div class="relative">
      <button class="bg-neutral-800 text-white px-2 py-1 rounded-md" on:click={toggleDropdown} aria-label="Select Aphasia Type">
        {#if isMenuOpen}
      <i class="material-icons">close</i>
        {:else}
      <i class ="material-icons">menu</i>
        {/if}
      </button>
      <div id="dropdown" class="absolute right-0 mt-2 bg-white border border-gray-300 rounded-md shadow-md hidden">
        <ul class="py-1">
          <li><button on:click={changeType} class="block px-4 py-2 hover:bg-gray-100">Type 1 Aphasia</button></li>
          <li><button on:click={changeType2} class="block px-4 py-2 hover:bg-gray-100">Type 2 Aphasia</button></li>
          <div class="slidecontainer">
            <li><button on:click={font} class="block px-4 py-2 hover:bg-gray-100">Font Size</button></li>
            <input type="range" min="10" max="26" value="18" class="slider" id="myRange">
            
          </div>
          <li>{#if $username}
            <form method="POST" action="/?/logout" use:enhance={logout} >
              <button class="block px-4 py-2 hover:bg-gray-100">Log Out</button>
            </form>
          {/if}</li>
          <!-- Add more options as needed -->
        </ul>
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

        p:hover .no-show{
          display:inline;
        }
        
        p:hover{
          border-radius: 8px;
          padding: 1px;
          width:fit-content;
          background-color: rgb(180, 180, 180);
        } 
        .material-icons {
          font-size: 20px;
          cursor: pointer;
        }  

        .slidecontainer {
          width: 100%;
        }

        .slider {
          -webkit-appearance: none;
          width: 80%;
          height: 15px;
          border-radius: 5px;  
          background: #d3d3d3;
          outline: none;
          opacity: 0.7;
          -webkit-transition: .2s;
          transition: opacity .2s;
         }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 25px;
          height: 25px;
          border-radius: 50%; 
          background: #404040;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 25px;
          height: 25px;
          border-radius: 50%;
          background: #404040;
          cursor: pointer;
        }
       </style>


    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" integrity="sha512-iBBXm8fW90+nuLcSKlbmrPcLa0OT92xO1BIsZ+ywDWZCvqsWgccV3gFoRBv0z+8dLJgyAHIhR35VZc2oM/gI1w==" crossorigin="anonymous" referrerpolicy="no-referrer" />

      <br class="h-24" />
      <h2 class="font-semibold text-lg" style="line-height:40px">What we think you are trying to say: (version {$transcriptProcessor.transformations.version})</h2>
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