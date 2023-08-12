<script lang="ts">
  import SubtitleNodeCard from "./SubtitleNodeCard.svelte";
  import { currentPlaybackTime, waveStore, isPlayable } from "../store";
  import { afterUpdate } from "svelte";
  export let currentTrack;

  let currentEditorLength = 0;
  const updateTimelineWidth = () => {
    let waveContainer: HTMLElement = document.querySelector("#wave-container");
    let waveForm: HTMLElement = document.querySelector("#waveform");
    if (waveContainer) {
      waveForm.style.width = waveContainer.offsetHeight + "px";
    }
  };

  afterUpdate(() => {
    let waveContainer: HTMLElement = document.querySelector("#wave-container");
    if (waveContainer) {
      if (currentEditorLength !== waveContainer.offsetHeight) {
        updateTimelineWidth();
        currentEditorLength = waveContainer.offsetHeight;
      }
    }
  });
</script>

<div class="max-h-[calc(100vh-9em)] overflow-auto py-4">
  <div class="flex justify-center relative">
    <div class="flex w-2/12 relative" id="wave-container">
      {#if !$isPlayable}
        <div class="text-xs flex flex-col w-full text-center items-center">
          <div>Loading Media. Takes a few seconds with large files.</div>
          <div class="lds-ripple">
            <div></div>
            <div></div>
          </div>
        </div>
      {/if}
      <div
        id="waveform"
        class="transform rotate-90 absolute top-0 bottom-0 right-0"
      ></div>
    </div>
    <div class="w-10/12" id="main-editor">
      {#each $currentTrack.iterate() as subtitleNode (subtitleNode.data.uuid)}
        <SubtitleNodeCard
          node={subtitleNode}
          {currentTrack}
          {currentPlaybackTime}
        />
      {/each}
    </div>
  </div>
</div>

<style>
  .lds-ripple {
    display: inline-block;
    position: relative;
    width: 80px;
    height: 80px;
  }
  .lds-ripple div {
    position: absolute;
    border: 4px solid #cef;
    opacity: 1;
    border-radius: 50%;
    animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
  }
  .lds-ripple div:nth-child(2) {
    animation-delay: -0.5s;
  }
  @keyframes lds-ripple {
    0% {
      top: 36px;
      left: 36px;
      width: 0;
      height: 0;
      opacity: 0;
    }
    4.9% {
      top: 36px;
      left: 36px;
      width: 0;
      height: 0;
      opacity: 0;
    }
    5% {
      top: 36px;
      left: 36px;
      width: 0;
      height: 0;
      opacity: 1;
    }
    100% {
      top: 0px;
      left: 0px;
      width: 72px;
      height: 72px;
      opacity: 0;
    }
  }
</style>
