<script lang="ts">
    import TextArea from "@/components/TextArea.svelte";
    let prompt = '';
    let voices = ['Alloy', 'Ash', 'Coral', 'Echo', 'Fable', 'Onyx', 'Nova', 'Sage', 'Shimmer'];
    let selectedVoice = voices[0];

    let isRecording = false; // State variable to toggle between icons

    function startRecording() {
        isRecording = !isRecording; // Toggle recording state on click
        console.log(isRecording ? 'Start recording (To be implemented)' : 'Stop recording (To be implemented)');
    }
</script>

<!-- Main wrapper div for centering the content -->
<div class="flex justify-center items-center min-h-screen p-4">
    <!-- Inner wrapper to control the size of the TextArea and margin from edges -->
    <div class="w-full max-w-6xl p-4 bg-white rounded-lg shadow-lg">
        <!-- Pass class to TextArea component -->
        <TextArea bind:value={prompt} class="w-full p-4" />
    </div>
</div>
