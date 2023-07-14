<script lang="ts">
  import type { PageData } from "./$types";
  import { enhance } from "$app/forms";
  import LoginModel from "@/components/LoginModel.svelte";
  import Controls from "@/components/Controls.svelte";
  import { transcriptProcessor } from "@/stores/transcriptProcessor";
  import { username } from "@/stores/user";
  import { onMount } from "svelte";

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

  function logout() {
    transcriptProcessor.clear();
    $username = null;
  }

  function onFail(message: string) {
    transcriptProcessor.stopRecording();
    alert(message);
  }

  let wordsNumber = $transcriptProcessor.transcript.text.length;
  console.log("wordsNumber is: ", wordsNumber);
  //delete function
  let hover = false;
 let clicked = false;
 let icon = "";

 function onClick() {
		clicked = true;	
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

      

        <li style="display:inline-block; padding: 1px"  
        class:hover 
        class = "beforeHover"
        on:mouseenter={()=>{
          if(!clicked){
            hover = true;
          }
          icon = "close";
        }}

        on:mouseleave={()=>{
        if(!clicked){
        hover = false;
        }
        icon = "";
        }}>

        {word} 

        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <i class="material-icons" style="font-size: 15px; color: white"
        on:click={onclick}>
        {icon}
      </i>
    </li>
      {/each}

      <style>
        .beforeHover{
                border-radius: 10px;
                  padding: 1px;
                  width:fit-content;
                  background-color: rgb(222, 222, 222)
                  
              }
        .hover {
                  border-radius: 10px;
                  padding: 1px;
                  width:fit-content;
                  background-color: rgb(180, 180, 180);;
              }
              
      </style>

      
      <!-- <style>
        p.youSaid{
          border: 3px solid rgb(240, 240, 240);
          border-radius: 12px;
          padding: 5px;
	        width:fit-content; 
          background-color: rgb(222, 222, 222);
		    }
        .youSaid:hover{
          border: 3px solid rgb(199, 199, 199);
          border-radius: 12px;
          padding: 5px;
	        width:fit-content;
          background-color: rgb(180, 180, 180);
        }
      </style> -->


      <br class="h-24" />
      <h2 class="font-semibold text-lg">What we think you are trying to say: (version {$transcriptProcessor.transformations.version})</h2>
      <ul>
        {#each $transcriptProcessor.transformations.texts as transformation}
          <li class="list-disc list-inside mb-2">{transformation}</li>
        {/each}
      </ul>
    </div>



  </section>
</main>
