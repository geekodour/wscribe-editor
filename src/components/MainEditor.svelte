<script lang="ts">
  import SubtitleNodeCard from "./SubtitleNodeCard.svelte";
  import { currentPlaybackTime } from "../store";
  export let currentTrack;
</script>

<div class="max-h-[calc(100vh-10em)] overflow-auto py-4">
  {#each $currentTrack.iterate() as subtitleNode (subtitleNode.data.uuid)}
    <SubtitleNodeCard
      node={subtitleNode}
      {currentTrack}
      {currentPlaybackTime}
    />
  {/each}
</div>
