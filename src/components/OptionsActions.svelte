<script lang="ts">
  export let toggleTranscriptView;
  export let toggleScoreView;
  export let scoreView;
  export let transcriptView;
  import {
    subtitleTrackStore,
    transcriptTrackStore,
    wordLevelData,
  } from "../store";
</script>

<div class="flex flex-col gap-2 px-2">
  <div class="flex justify-center gap-2">
    <button
      class="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:ring focus:ring-violet-300"
      on:click={toggleTranscriptView}
    >
      {transcriptView ? "Subtitle Mode" : "Transcript Mode"}
    </button>
    {#if $wordLevelData}
      <button
        class="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:ring focus:ring-violet-300"
        on:click={toggleScoreView}
      >
        {scoreView ? "Hide confidence" : "Show confidence"}
      </button>
    {/if}
  </div>
</div>
