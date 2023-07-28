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
        <button class="bg-neutral-800 text-white px-2 py-1 rounded-md block ml-auto mr-0 mt-1"
          >Log Out</button
        >
      </form>
    {/if}
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
            <i class="material-icons"  style="font-size: 15px; color: white" on:click={()=>deleteFunction($transcriptProcessor.transcript.text.indexOf(word))} >
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

        .material-icons{
          display: none;
        }

        p:hover .material-icons{
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