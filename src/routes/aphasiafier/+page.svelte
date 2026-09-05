<script lang="ts">
  import TextArea from "@/components/TextArea.svelte";
  import ModeNav from "@/components/ModeNav.svelte";
</script>

<svelte:head>
  <title>Aphasiafier · Aphasia GPT</title>
</svelte:head>

<header class="flex items-center justify-between px-2 py-2 md:px-4">
  <ModeNav />
</header>

<TextArea />
