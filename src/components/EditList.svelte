<script lang="ts">
  /**
   * Title text of the list
   */
  export let title: string = "";

  /**
   * Array of items in the list
   */
  export let items: string[] = [];

  /**
   * Input value for adding new list items
   */
  export let inputValue: string = "";

  /**
   * Adds a new list item
   */
  export let addItem: () => void;

  /**
   * Removes a list item
   */
  export let removeItem: (item: string) => void;

</script>

<!-- @component An editable (appendable) list of items -->

<div class="rounded-md p-2 lg:p-4 bg-gray-200">
  <h2 class="font-bold text-xl text-center">{title}</h2>

  <!-- List of items -->
  <ul>
    {#each items as item}
    <li class="flex justify-between items-center">
      <div class="flex items-center w-full">
        <span class="truncate w-0 flex-grow" title={item}>{item}</span>
        <button on:click={() => removeItem(item)} class="flex items-center p-1" title="Remove" aria-label="Remove">
          <i class="material-icons" aria-hidden="true">delete</i>
        </button>
      </div>
    </li>
    {/each}
  </ul>

  <!-- Add new item -->
  <form on:submit|preventDefault={() => addItem()}>
    <li class="flex justify-between items-center gap-1">
      <input type="text" bind:value={inputValue} placeholder="Add" class="flex-1 p-1 rounded-md bg-white outline-none"/>
      <button type="submit" class="flex items-center p-1 rounded-md bg-green-100 text-green-500" title="Add" aria-label="Add">
        <i class="material-icons" aria-hidden="true">add</i>
      </button>
    </li>
  </form>
</div>
