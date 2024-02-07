<script lang="ts">
  import { contextStore } from "../stores/contextStore";
  import Modal from "./Modal.svelte";
  import EditList from "./EditList.svelte";

  /**
   * Toggles the visibility of the modal itself.
   */
  export let toggleModal: () => void;

</script>

<!-- @component A modal to edit context options -->

<Modal title="Context Options" toggleVisibility={toggleModal}>
  <div class="flex flex-col lg:flex-row justify-between gap-4">
    <div class="lg:w-1/3">
      <EditList
        bind:title={$contextStore.settingContext.contextTitle}
        bind:items={$contextStore.settingContext.options}
        bind:inputValue={$contextStore.settingContext.inputValue}
        bind:errorMessage={$contextStore.settingContext.errorMessage}
        addItem={contextStore.addSettingOption}
        removeItem={contextStore.removeSettingOption}
      />
    </div>
    <div class="lg:w-1/3">
      <EditList
        bind:title={$contextStore.typeContext.contextTitle}
        bind:items={$contextStore.typeContext.options}
        bind:inputValue={$contextStore.typeContext.inputValue}
        bind:errorMessage={$contextStore.typeContext.errorMessage}
        addItem={contextStore.addTypeOption}
        removeItem={contextStore.removeTypeOption}
      />
    </div>
    <div class="lg:w-1/3">
      <EditList
        bind:title={$contextStore.toneContext.contextTitle}
        bind:items={$contextStore.toneContext.options}
        bind:inputValue={$contextStore.toneContext.inputValue}
        bind:errorMessage={$contextStore.toneContext.errorMessage}
        addItem={contextStore.addToneOption}
        removeItem={contextStore.removeToneOption}
      />
    </div>
  </div>
  <div class="flex justify-center mt-12">
    <button
      class="bg-red-400 hover:bg-red-600 text-white font-bold py-2 px-2 rounded-md flex items-center"
      on:click={() => contextStore.resetUserContextsToDefaults()}
    >
      <i class="material-icons mr-1">refresh</i> Restore Defaults
    </button>
  </div>
</Modal>