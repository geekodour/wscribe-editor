<script lang="ts">
  import { currentPlaybackTime } from "../store";
  import ph from "../assets/placeholder.png";
  import { onMount } from "svelte";

  let videoPlayer: HTMLVideoElement;
  function handleVideoSelect(event: any) {
    const selectedVideo = event.target.files[0];
    let fileURL = URL.createObjectURL(selectedVideo);
    let videoNode = document.querySelector("video");
    videoNode.src = fileURL;
    videoNode.autoplay = true;
  }

  function handleSpaceKeyPress(event: any) {
    if (event.key === " ") {
      if (videoPlayer.paused) {
        videoPlayer.play();
      } else {
        videoPlayer.pause();
      }
    }
  }

  const updateGlobalPlaybackTime = (event: any) => {
    $currentPlaybackTime = event.target.currentTime;
  };

  const pbSpeed = (speed: number): void => {
    videoPlayer.playbackRate = speed;
  };

  onMount(() => {
    window.addEventListener("keydown", handleSpaceKeyPress);
    return () => {
      window.removeEventListener("keydown", handleSpaceKeyPress);
    };
  });
</script>

<div>
  <div>
    <video
      bind:this={videoPlayer}
      poster={ph}
      controls
      preload="metadata"
      src="/wscribe_editor_intro.mp3"
      on:timeupdate={updateGlobalPlaybackTime}
    ></video>
  </div>
  <div class="flex justify-between border-2 border-black">
    <div class="flex justify-around w-full">
      <button
        class="w-full hover:bg-black hover:text-white"
        on:click={() => pbSpeed(0.5)}>x0.5</button
      >
      <button
        class="w-full hover:bg-black hover:text-white"
        on:click={() => pbSpeed(1)}>x1</button
      >
      <button
        class="w-full hover:bg-black hover:text-white"
        on:click={() => pbSpeed(2)}>x2</button
      >
      <button
        class="w-full hover:bg-black hover:text-white"
        on:click={() => pbSpeed(3)}>x3</button
      >
    </div>
    <input
      class="hidden"
      id="media"
      type="file"
      accept="video/*, audio/*"
      on:change={handleVideoSelect}
    />
  </div>
</div>
