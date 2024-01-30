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
      <h2 class="font-semibold  text-center">{title}</h2>
    <select bind:value={selectedItem} on:change={() => setSelectedItem(selectedItem)}>
      {#each options as option (option)}
        <option value={option}>{option}</option>
      {/each}
    </select>
  </div>
