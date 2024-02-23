<script lang="ts">
  /**
   * The path data for the SVG icon. As used in the `d` attribute of the <path> element.
   */
  export let svgPathData: string | string[] = "";
  $: svgPaths = Array.isArray(svgPathData) ? svgPathData : [svgPathData];
</script>

<!-- @component A reusable SVG icon -->

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="currentColor"
  class="w-full h-full"
>
  {#each svgPaths as pathData}
    <path d={pathData} fill-rule="evenodd" clip-rule="evenodd" />
  {/each}
</svg>
