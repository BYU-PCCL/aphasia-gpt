<script lang="ts">

  /** Title text of the options. */
  export let title: string;

  /** Currently selected item. */
  export let selectedItem: string;

  /** Sets the selected item on change. */
  export let setSelectedItem: (selectedItem: string) => void;
  
  /** Array of options to choose from. */
  export let options: string[];

</script>

<!-- @component A dropdown to select an option from a list. -->

<div>
  <div class="font-semibold max-sm:text-sm text-center pb-1">{title}</div>
  <select class="max-sm:text-xs text-black bg-white border-solid border-2 border-black-300 rounded-md p-1 sm:p-2" bind:value={selectedItem} on:change={() => setSelectedItem(selectedItem)}>
    {#each options as option (option)}
      <option value={option}>{option}</option>
    {/each}
  </select>
</div>
