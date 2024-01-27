<script lang="ts">
  import { Tone } from '@/lib/types/Tone';

  /** Currently selected tone. */
  export let selectedTone: Tone;

  /** Sets the selected tone on change. */
  export let setTone: (tone: Tone) => void;

  const tones = Object.values(Tone);
</script>

<!-- @component A dropdown to select a tone of voice. -->

<select bind:value={selectedTone} on:change={() => setTone(selectedTone)}>
  {#each tones as tone (tone)}
    <option value={tone}>{tone}</option>
  {/each}
</select>
