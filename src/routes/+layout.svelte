<script>
  import "../app.css"
  import { onMount } from 'svelte';
  import { contextStore } from '../stores/contextStore';

  onMount(async () => {
    await contextStore.initialize();
  });
</script>

<slot />


