<script lang="ts">
  import type { PageData } from "./$types";
  import { enhance } from "$app/forms";
  import LoginModel from "@/components/LoginModel.svelte";
  import Controls from "@/components/Controls.svelte";
  import { transcriptProcessor } from "@/stores/transcriptProcessor";
  import { username } from "@/stores/user";
  import { onMount } from "svelte";
  import { findIndex, indexOf, words } from "lodash";
  import { aphasiaType } from '../stores/user';
  // import {aphasiaType1} from "@/routes/api/gpt/+server"
  // export {aphasiaType};

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
 //drop down logic
 let aphasiaStore;
  function toggleDropdown(event: MouseEvent) {
    event.preventDefault();
    const dropdown = document.getElementById("dropdown");
    if (dropdown) {
      dropdown.classList.toggle("hidden");
    }
  }

  $:aphasiaType.subscribe((value) => {
    aphasiaStore = value;
  })

  function changeType(){
    aphasiaType.set("Broca's Aphasia");
  }
	
  
  function changeType2(){
    aphasiaType.set("vernickeies aphasia");
  }
  
  function font(){
    console.log("change font");
	
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
        
        <i class="material-icons">menu</i>
      </button>
      <div id="dropdown" class="absolute right-0 mt-2 bg-white border border-gray-300 rounded-md shadow-md hidden">
        <ul class="py-1">
          <li><button on:click={changeType} class="block px-4 py-2 hover:bg-gray-100">Type 1 Aphasia</button></li>
          <li><button on:click={changeType2} class="block px-4 py-2 hover:bg-gray-100">Type 2 Aphasia</button></li>
          <li><button on:click={font} class="block px-4 py-2 hover:bg-gray-100">Font Size</button></li>
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
    <Mic
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
          border-radius: 5px;
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
          border-radius: 10px;
          padding: 1px;
          width:fit-content;
          background-color: rgb(180, 180, 180);
        }       
      </style>


      <br class="h-24" />
      <h2 class="font-semibold text-lg">What we think you are trying to say: (version {$transcriptProcessor.transformations.version})</h2>
      <ul>
        {#each $transcriptProcessor.transformations.texts as transformation}
          <li class="list-disc list-inside mb-2" style="font-size: {fontSize}px">{transformation}</li>
        {/each}
      </ul>
    </div>



  </section>
</main>