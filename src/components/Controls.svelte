<script lang="ts">
  import {
    SVG_TRASH_ICON_PATH_DATA,
    SVG_MICROPHONE_ICON_TOP_PATH_DATA,
    SVG_MICROPHONE_ICON_BOTTOM_PATH_DATA,
    SVG_DELETE_ICON_PATH_DATA,
  } from "@/lib/constants";
  import ControlButton from "./ControlButton.svelte";
  import { onMount } from "svelte";
  import SvgIcon from "./SvgIcon.svelte";

  export let isRecording: boolean;
  export let hasTranscript: boolean;
  export let toggleRecording: () => void;
  export let onNew: () => void;
  export let onBack: () => void;

  let centerButtonDiv: HTMLElement;
  $: showExtraControls = hasTranscript || isRecording;
  $: flyTransitionDistance = 0;

  onMount(() => {
    const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      const entry = entries.at(0); // We're only watching one element
      if (entry) {
        // Set the distance so that the side buttons can fly in from the correct
        // distance and look as though it's coming from behind the center button
        flyTransitionDistance = entry.contentRect.width + entry.contentRect.width * 0.2;
      }
    });
    resizeObserver.observe(centerButtonDiv);  // observe the center button
    return () => resizeObserver.unobserve(centerButtonDiv); // cleanup
  });
</script>

<!-- @component A control panel for the audio recording -->

<section class="flex gap justify-center">
  {#if showExtraControls}
    <ControlButton
      buttonClass="bg-sky-100 text-sky-500"
      onClick={onNew}
      flyParamX={flyTransitionDistance}
    >
      <SvgIcon svgPathData={SVG_TRASH_ICON_PATH_DATA} />
    </ControlButton>
  {/if}

  <div bind:this={centerButtonDiv} class="px-2 sm:px-5 z-10">
    <ControlButton buttonClass="bg-red-100 text-red-500 {isRecording ? 'p-0' : ''}" onClick={toggleRecording}>
      {#if isRecording}
        <div class="bg-red-500 mx-auto rounded-md w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
      {:else}
        <SvgIcon
          svgPathData={[SVG_MICROPHONE_ICON_TOP_PATH_DATA, SVG_MICROPHONE_ICON_BOTTOM_PATH_DATA]}
        />
      {/if}
    </ControlButton>
  </div>

  {#if showExtraControls}
    <ControlButton
      buttonClass="bg-stone-200/80 text-stone-500"
      onClick={onBack}
      flyParamX={-flyTransitionDistance}
    >
      <SvgIcon svgPathData={SVG_DELETE_ICON_PATH_DATA} />
    </ControlButton>
  {/if}
</section>
