<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";

    export let transcript = "";
    let isEditing = false;
    let editedTranscript: string = transcript;
    let textareaElement: HTMLTextAreaElement | null = null; // Reference for textarea

    const dispatch = createEventDispatcher();

    function closeEditModal() {
        isEditing = false;
        dispatch("close"); // Notify parent to close modal
    }

    function saveEdit() {
        dispatch("save", editedTranscript.trim());
        closeEditModal(); // Close modal after saving
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Enter" && !event.shiftKey) { // Shift+Enter allows a new line
            event.preventDefault(); // Prevent new line
            saveEdit(); // Save and close the modal
        }
    }

    // Auto-focus on the text area and place cursor at the end
    onMount(() => {
        if (textareaElement) {
            textareaElement.focus();
            textareaElement.setSelectionRange(editedTranscript.length, editedTranscript.length);
        }
    });
</script>

<!-- Modal Overlay -->
<div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div class="relative bg-white rounded-lg shadow-lg w-full max-w-md">

        <!-- Close Button -->
        <button class="absolute top-3 right-3 text-gray-500 hover:text-black transition" on:click={closeEditModal}>
            <i class="material-icons text-xl">close</i>
        </button>

        <!-- Modal Content -->
        <div class="px-6 pt-6 pb-4">
            <h2 class="text-lg font-semibold mb-3">Edit Transcript</h2>

            <textarea
                    bind:value={editedTranscript}
                    bind:this={textareaElement}
                    class="w-full border border-gray-300 rounded-md p-2 "
                    on:keydown={handleKeydown}
            ></textarea>
        </div>

        <!-- Buttons Section -->
        <div class="flex justify-center gap-2 px-6 pb-4">
            <button class="w-1/3 bg-red-400 text-white px-4 py-2 text-center rounded-md hover:bg-red-500 transition" on:click={closeEditModal}>
                Cancel
            </button>
            <button class="w-1/3 bg-blue-400 text-white px-4 py-2 text-center rounded-md hover:bg-blue-500 transition" on:click={saveEdit}>
                Save
            </button>
        </div>
    </div>
</div>
