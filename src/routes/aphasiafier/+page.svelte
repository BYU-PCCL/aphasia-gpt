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

<TextArea bind:value={prompt} class="w-full p-2" />

