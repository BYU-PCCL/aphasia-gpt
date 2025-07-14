<script lang="ts">
    import TextArea from "@/components/TextArea.svelte";
    let prompt = ' ';
</script>

<TextArea bind:value={prompt} class="w-full p-2" />