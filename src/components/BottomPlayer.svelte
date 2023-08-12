<script lang="ts">
  import { waveStore, isPlayable, currentPlaybackTime } from "../store";
  const updateCurrentTimestamp = (e: Event) => {
    $waveStore.setTime((e.target as HTMLInputElement).value);
  };

  const pbSpeed = (speed: number, increment: boolean = true): void => {
    if (speed) {
      $waveStore.setPlaybackRate(speed);
      return;
    }
    if (increment) {
      $waveStore.setPlaybackRate($waveStore.getPlaybackRate() + 0.5);
    }
  };
</script>

<div class="flex w-full items-center">
  {#if $isPlayable}
    <div class="py-2 px-4 w-full">
      <input
        class="w-full"
        type="range"
        min="0"
        on:change={updateCurrentTimestamp}
        max={$waveStore.getDuration()}
        value={$currentPlaybackTime}
      />
    </div>
    <div class="flex gap-2">
      <button
        on:click={() => {
          pbSpeed(0.5, false);
        }}
        class="rounded-md bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:ring focus:ring-violet-300"
        >0.5x</button
      >
      <button
        on:click={() => {
          pbSpeed(1);
        }}
        class="rounded-md bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:ring focus:ring-violet-300"
        >1x</button
      >
      <button
        on:click={() => {
          pbSpeed(null, true);
        }}
        class="rounded-md bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:ring focus:ring-violet-300"
        >+0.5x</button
      >
    </div>
  {/if}
</div>
