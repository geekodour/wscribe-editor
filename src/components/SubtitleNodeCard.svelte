<svelte:options immutable />

<script lang="ts">
  import { msToTimestamp, wordColor } from "../utils";
  import { afterUpdate } from "svelte";
  import clsx from "clsx";
  import { scoreView, wordLevelData, waveStore } from "../store";

  export let node;
  export let currentTrack;
  export let currentPlaybackTime;

  let card;
  let startTs: number = node.data.start;
  let endTs: number = node.data.end;
  $: duration = (endTs - startTs) / 1000;

  $: prePause = node.prePause() / 1000;
  $: postPause = node.postPause() / 1000;
  $: offsetEditMode = node.data.offsetEditMode;

  const updateTimestamps = () => {
    currentTrack.updateTsForSegment(node, { start: startTs, end: endTs });
  };

  let currentlyPlaying = false;
  $: wordLevelTracking = $wordLevelData;
  // because of this, beforeUpdate will be called twice
  // See https://github.com/sveltejs/svelte/issues/6016
  let refContentEditable;

  const jumpToTimestamp = (t: number) => {
    $waveStore.setTime(t / 1000);
  };

  afterUpdate(() => {
    if (!offsetEditMode && wordLevelTracking && refContentEditable) {
      const wordSpans = refContentEditable.querySelectorAll("span[data-start]");
      if ($scoreView) {
        for (let i = 0; i < wordSpans.length; i++) {
          wordSpans[i].classList.add(
            wordColor(wordSpans[i].dataset.score * 100),
          );
        }
      } else {
        for (let i = 0; i < wordSpans.length; i++) {
          wordSpans[i].classList.remove(
            wordColor(wordSpans[i].dataset.score * 100),
          );
        }
      }

      for (let i = 0; i < wordSpans.length; i++) {
        wordSpans[i].addEventListener("click", (e) => {
          e.stopPropagation();
          jumpToTimestamp(e.target.dataset.start);
        });
      }
    }
  });

  $: {
    if (!offsetEditMode) {
      if (
        $currentPlaybackTime > startTs / 1000 &&
        $currentPlaybackTime < endTs / 1000
      ) {
        if (!currentlyPlaying && card) {
          // if set the first time
          card.scrollIntoView();
        }
        currentlyPlaying = true;
        // TODO: put this element on top view

        if (wordLevelTracking && refContentEditable) {
          let wordSpans =
            refContentEditable.querySelectorAll("span[data-start]");
          for (let i = 0; i < wordSpans.length; i++) {
            let wstart = wordSpans[i].dataset.start / 1000;
            let wend = wordSpans[i].dataset.end / 1000;
            if ($currentPlaybackTime > wstart && $currentPlaybackTime < wend) {
              wordSpans[i].classList.add("wordhighlight");
              setTimeout(() => {
                wordSpans[i].classList.remove("wordhighlight");
              }, 1000);
            }
          }
        }
      } else {
        currentlyPlaying = false;
      }
    }
  }
</script>

<div>
  {#if prePause > 0}
    <div class="flex justify-center text-xs text-stone-500 font-mono">
      🤜
      {prePause}s 🤛
    </div>
  {/if}
  <div
    bind:this={card}
    class={clsx(
      "mb-2 flex mx-4 rounded-lg shadow-lg bg-zinc-100",
      currentlyPlaying && "playing",
    )}
    on:click={() => {
      jumpToTimestamp(node.data.start);
    }}
  >
    <!-- segment info -->
    <div
      class="w-1/6 bg-yellow-100 flex flex-col justify-center text-xs rounded-lg pl-2 font-mono"
    >
      <div>D: {duration}s</div>
      <div>{msToTimestamp(startTs)}</div>
      <div>{msToTimestamp(endTs)}</div>
    </div>
    <!-- edit area -->
    <div class="w-full pl-2 flex flex-col justify-center py-2">
      {#if offsetEditMode}
        {#if prePause > 0}
          <div class="flex justify-center">
            <button
              class="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:ring focus:ring-violet-300"
              on:click|stopPropagation={() =>
                currentTrack.appendBeforeSegment(node)}
              >Add New Segment Above</button
            >
          </div>
        {/if}
        <div class="px-2 py-4 font-mono text-xs">
          <div>
            Min: {msToTimestamp(node.minOffset())} Max:
            {msToTimestamp(endTs)}
            <input
              class="w-full"
              type="range"
              bind:value={startTs}
              on:change={() => {
                updateTimestamps();
              }}
              min={node.minOffset()}
              max={endTs}
            />
          </div>
          <div>
            Min: {msToTimestamp(startTs)} Max: {msToTimestamp(node.maxOffset())}
            <input
              type="range"
              class="w-full"
              bind:value={endTs}
              on:change={() => {
                updateTimestamps();
              }}
              min={startTs}
              max={node.maxOffset()}
            />
          </div>
        </div>
        {#if postPause > 0}
          <div class="flex justify-center">
            <button
              class="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:ring focus:ring-violet-300"
              on:click|stopPropagation={() =>
                currentTrack.appendAfterSegment(node)}
              >Add New Segment Below
            </button>
          </div>
        {/if}
      {:else}
        <div
          contenteditable="true"
          bind:this={refContentEditable}
          class="h-full py-4"
          bind:innerHTML={node.data.wordsHTML}
        ></div>
      {/if}
    </div>
    <!-- edit buttons -->
    <div class="flex flex-col justify-center">
      <div
        class="p-4 hover:bg-black hover:text-white rounded-full cursor-pointer"
        on:click|stopPropagation={() =>
          currentTrack.toggleEditModeForSegment(node)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="h-4 w-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
          />
        </svg>
      </div>
      <div
        class="p-4 hover:bg-black hover:text-white rounded-full cursor-pointer"
        on:click|stopPropagation={() => currentTrack.removeSegment(node)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="h-4 w-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
          />
        </svg>
      </div>
    </div>
  </div>
</div>
