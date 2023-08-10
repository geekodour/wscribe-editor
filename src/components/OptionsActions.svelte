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

<div class="flex flex-col gap-2">
  <div class="flex justify-center gap-2">
    <button
      class="px-3 py-2 hover:bg-black hover:text-white border-black border-2"
      on:click={toggleTranscriptView}
    >
      {transcriptView ? "Subtitle Mode" : "Transcript Mode"}
    </button>
    {#if $wordLevelData}
      <button
        class="px-3 py-2 hover:bg-black hover:text-white border-black border-2"
        on:click={toggleScoreView}
      >
        {scoreView ? "Hide confidence" : "Show confidence"}
      </button>
    {/if}
  </div>
</div>
