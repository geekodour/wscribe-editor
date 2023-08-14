<script lang="ts">
  import {
    currentPlaybackTime,
    waveStore,
    mediaStoreURL,
    isPlayable,
    fileInfo,
  } from "../store";
  import { msToTimestamp, newSessionMetadata } from "../utils";
  import { onMount } from "svelte";
  import type { SessionMetadata } from "../types";
  import WaveSurfer from "wavesurfer.js";
  export let currentTrack;
  let metadata: SessionMetadata;

  function handleMediaSelect(event: any) {
    const selectedMedia = event.target.files[0];
    let fileURL = URL.createObjectURL(selectedMedia);

    fileInfo.update((e) => ({
      ...e,
      mediaFileName: selectedMedia.name,
    }));

    mediaStoreURL.set(fileURL);

    isPlayable.set(false);
    $waveStore.destroy();

    initWaveForm();
  }

  const isContentEditable = (element): boolean => {
    if (!element) return false;
    return (
      element.isContentEditable ||
      (element.parentNode && isContentEditable(element.parentNode))
    );
  };

  function handleSpaceKeyPress(event: any) {
    if (event.key === " ") {
      if (!isContentEditable(event.target)) {
        $waveStore.playPause();
      }
    }
  }

  const initWaveForm = () => {
    waveStore.set(
      WaveSurfer.create({
        container: document.querySelector("#waveform") as HTMLElement,
        waveColor: "#78716c",
        progressColor: "#ea580c",
        fillParent: true,
        url: $mediaStoreURL,
        interact: false,
        barWidth: 2,
        barGap: 1,
        barAlign: "top",
        barRadius: 2,
      }),
    );
    $waveStore.setVolume(1)
    $waveStore.on("timeupdate", (currentTime: number) => {
      currentPlaybackTime.set(currentTime);
    });
    $waveStore.on("ready", () => {
      isPlayable.set(true);
    });
  };

  $: {
    metadata = newSessionMetadata(
      $fileInfo.mediaFileName,
      $fileInfo.transcriptFileName,
      $waveStore && $waveStore.getDuration()
        ? msToTimestamp($waveStore.getDuration() * 1000, ".", true)
        : "",
      $currentTrack ? msToTimestamp($currentTrack.tail.data.end) : "",
      msToTimestamp($currentPlaybackTime * 1000, ".", true),
      $waveStore ? $waveStore.getPlaybackRate() + "x" : "",
      $currentTrack.size,
    );
  }

  onMount(() => {
    initWaveForm();

    window.addEventListener("keydown", handleSpaceKeyPress);

    // destroy
    return () => {
      window.removeEventListener("keydown", handleSpaceKeyPress);
      $waveStore.destroy();
    };
  });
</script>

<div class="px-2 text-xs font-mono gap-4 flex flex-col">
  <div class="overflow-x-scroll py-4">
    {#if $isPlayable}
      {#each Object.entries(metadata) as [k, v]}
        {#if v.value}
          <div><b>{v.alias}:</b> {v.value}</div>
        {/if}
      {/each}
    {/if}
  </div>
  <div>
    <div class="mb-2">help 💡</div>
    <ul class="list-disc list-inside">
      <li>Use <kbd>space</kbd> to play/pause</li>
      <li>
        Edit/Add segments:
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="h-4 w-4 inline"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
          />
        </svg>
      </li>
      <li>
        Remove segments:
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="h-4 w-4 inline"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
          />
        </svg>
      </li>
      <li>Change playback speed with (n)x</li>
      <li>Toggle between transcript & subtitle</li>
      <li>Toggle confidence (if applicable)</li>
      <li>
        This is only a transcript editor, it does not generate. Check <a
          href="https://github.com/geekodour/wscribe"
          class="underline">wscribe</a
        > to generate transcripts.
      </li>
    </ul>
  </div>
  <div class="flex justify-between">
    <input
      class="hidden"
      id="media"
      type="file"
      accept="video/*, audio/*"
      on:change={handleMediaSelect}
    />
  </div>
</div>

<style>
  kbd {
    padding: 0.08em 0.5em;
    white-space: nowrap;
    color: black;
    background: #eee;
    border-width: 1px 3px 3px 1px;
    border-style: solid;
    border-color: #ccc #aaa #888 #bbb;
  }
</style>
