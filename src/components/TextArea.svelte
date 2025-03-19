<script lang="ts">
  import { Textarea, Toolbar, ToolbarButton, Button } from 'flowbite-svelte';
  import { MicrophoneOutline, MicrophoneSlashOutline } from 'flowbite-svelte-icons';

  // Sample voices
  let voices = ['Alloy', 'Ash', 'Coral', 'Echo', 'Fable', 'Onyx', 'Nova', 'Sage', 'Shimmer'];

  // Default selected voice
  export let textAreaClass = 'w-full max-w-full p-4';  // Use max-w-full to cover entire width

  // State for multiple tabs
  let tabs = [
    { id: 1, name: 'Tab 1', prompt: '', selectedVoice: voices[0], isMicrophoneOn: false }
  ];
  let activeTab = 1; // The currently active tab

  // State to toggle the voice dropdown visibility
  let isVoicePickerOpen = false;
  let isEditingName = false; // Flag to track whether the tab name is being edited

  // Function to handle voice selection for the active tab
  function selectVoice(voice: string) {
    tabs[activeTab - 1].selectedVoice = voice;
    isVoicePickerOpen = false; // Close the dropdown after selection
  }

  // Function to toggle microphone state for the active tab
  function toggleMicrophone() {
    tabs[activeTab - 1].isMicrophoneOn = !tabs[activeTab - 1].isMicrophoneOn;
  }

  // Function to add a new tab
  let nextTabId = 2; // Start at 2 since the initial tab has an ID of 1.

  function addTab() {
    const newTabId = nextTabId++; // Increment the unique counter for each new tab.
    tabs = [
      ...tabs,
      {
        id: newTabId, // Assign the new unique ID.
        name: `Tab ${newTabId}`,
        prompt: '',
        selectedVoice: voices[0],
        isMicrophoneOn: false,
      },
    ];
    activeTab = newTabId; // Set the newly added tab as active.
  }

  function deleteTab(tabId: number) {
    if (tabs.length > 1) {
      // Filter out the tab to be deleted.
      const updatedTabs = tabs.filter((tab) => tab.id !== tabId);

      // Update the active tab to ensure it's valid after deletion.
      if (tabId === activeTab) {
        // If the deleted tab was active, switch to a safe active tab.
        const nextActiveTab = updatedTabs[0]; // Default to the first tab if possible.
        activeTab = nextActiveTab ? nextActiveTab.id : 0; // Fallback to 0 if no tabs left.
      }

      // Update the tabs array.
      tabs = updatedTabs;
    }
  }




  // Function to switch between tabs
  function switchTab(tabId: number) {
    activeTab = tabId;
  }

  // Function to handle renaming the tab
  function renameTab(tabId: number, newName: string) {
    tabs[tabId - 1].name = newName;
    isEditingName = false; // Stop editing after renaming
  }

  // Function to handle editing tab name
  function startEditingName(tabId: number) {
    // Start editing only for the double-clicked tab.
    if (activeTab === tabId) {
      isEditingName = true;
    }
  }




</script>

<div class="flex flex-col items-center justify-start mt-4 px-4">
  <!-- Tabs navigation -->
  <div class="flex space-x-4 mb-4">
    {#each tabs as tab}
      <div class="flex items-center">
        {#if activeTab === tab.id && isEditingName}
          <input
                  class="border p-1 rounded-md"
                  type="text"
                  bind:value={tab.name}
                  on:blur={() => {
      renameTab(tab.id, tab.name);
      isEditingName = false; // Exit editing mode
    }}
                  on:keydown={(e) => {
      if (e.key === 'Enter') {
        renameTab(tab.id, tab.name);
        isEditingName = false; // Exit editing mode on Enter
      }
    }}
                  autofocus
          />
        {:else}
          <div
                  class="cursor-pointer p-2 border-b-2 hover:border-blue-500 transition-colors"
                  class:selected={activeTab === tab.id}
                  on:click={() => switchTab(tab.id)}
                  on:dblclick={() => startEditingName(tab.id)}
          >
            {tab.name}
          </div>
        {/if}



        <!-- Delete button for the tab -->
        {#if tabs.length > 1}
          <button
                  class="ml-2 text-red-500 hover:text-red-700"
                  on:click={() => deleteTab(tab.id)}
          >
            <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
            </svg>
          </button>
        {/if}
      </div>
    {/each}

    <!-- Add new tab button -->
    <div class="cursor-pointer p-2" on:click={addTab}>
      <span class="text-xl">+</span>
    </div>
  </div>

  <!-- The active tab's content -->
  <form class="w-full">
    <Textarea
            class={textAreaClass}
            bind:value={tabs[activeTab - 1].prompt}
            placeholder="Write your prompt here"
    >
      <div slot="footer" class="flex items-center justify-between">
        <Button type="submit" class="mr-4">Change Prompt</Button>

        <Toolbar embedded>
          <!-- Voice selection toolbar button -->
          <div class="relative">
            <ToolbarButton type="button" on:click={() => isVoicePickerOpen = !isVoicePickerOpen}>
              Voice : {tabs[activeTab - 1].selectedVoice}
            </ToolbarButton>

            <!-- Microphone toggle button -->
            <ToolbarButton type="button" on:click={toggleMicrophone}>
              {#if tabs[activeTab - 1].isMicrophoneOn}
                <MicrophoneSlashOutline class="w-6 h-6" />
              {:else}
                <MicrophoneOutline class="w-6 h-6" />
              {/if}
            </ToolbarButton>

            <!-- Dropdown for voice selection -->
            {#if isVoicePickerOpen}
              <div class="absolute top-full mt-2 bg-white border border-gray-300 rounded-md shadow-md w-48">
                {#each voices as voice}
                  <div
                          class="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                          on:click={() => selectVoice(voice)}
                  >
                    {voice}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </Toolbar>
      </div>
    </Textarea>
  </form>
</div>
