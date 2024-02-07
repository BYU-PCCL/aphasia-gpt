<script lang="ts">

  /**
   * Title text of the modal.
   */
  export let title: string = "";

  /**
   * Toggles the visibility of the modal itself.
   */
  export let toggleVisibility: () => void;
  
</script>

<!-- @component A dismissable modal -->

<div class="absolute w-[100vw] h-[100vh] top-0 z-50 flex justify-center items-center bg-black/30">
  <div class="relative max-h-[80vh] sm:max-w-lg md:max-w-2xl lg:max-w-4xl bg-white rounded-md flex flex-col">
    <button class="absolute top-1 md:top-3 right-1 md:right-3 rounded-md p-2" on:click={toggleVisibility} title="Close" aria-label="Close" >
      <i class="material-icons" aria-hidden="true">close</i>
    </button>
    <h1 class="font-bold text-2xl pt-6 lg:pt-12 text-center">{title}</h1>
    <div class="overflow-y-auto p-6 lg:px-12 lg:pb-12">
        <slot>
          <!-- Content here -->
        </slot>
    </div>
  </div>
</div>