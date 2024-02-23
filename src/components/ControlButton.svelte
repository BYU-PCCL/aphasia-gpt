<script lang="ts">
  import { fly } from "svelte/transition";

  /**
   * CSS classes to add to the button classes.
   */
  export let buttonClass = "";
  /**
   * The x position to fly in from.
   */
  export let flyParamX: number | undefined = undefined;
  export let onClick = () => {};

  $: transition = flyParamX ? { x: flyParamX, duration: 250, opacity: 1 } : undefined;
</script>

<!-- @component A button that can fly in from the side -->

<button
  class="{buttonClass} inline-block rounded-full p-4 sm:p-7 md:p-10 h-20 w-20 sm:h-28 sm:w-28 md:h-36 md:w-36"
  transition:fly={transition}
  on:click={onClick}
>
  <slot>
    <!-- icon or button content-->
  </slot>
</button>
