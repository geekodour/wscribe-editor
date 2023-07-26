<script lang="ts">
  import type { MediaPlayerEvent } from "../types";
  import { currentPlaybackTime } from "../store";
  import ph from "../assets/placeholder.png";

  function handleVideoSelect(event) {
    const selectedVideo = event.target.files[0];
    let fileURL = URL.createObjectURL(selectedVideo);
    let videoNode = document.querySelector("video");
    videoNode.src = fileURL;
  }

  const updateGlobalPlaybackTime = (event: MediaPlayerEvent) => {
    $currentPlaybackTime = event.target.currentTime;
  };
</script>

<div>
  <div>
    <video
      poster={ph}
      controls
      autoplay
      on:timeupdate={updateGlobalPlaybackTime}
    ></video>
  </div>
  <div class="flex justify-between border-2 border-black">
    <div>PLAY</div>
    <div>+10</div>
    <div>-10</div>
    <div>x3</div>
    <input
      class="hidden"
      id="media"
      type="file"
      accept="video/*, audio/*"
      on:change={handleVideoSelect}
    />
    <label for="media" class="uppercase hover:bg-black hover:text-white"
      >Load Video</label
    >
  </div>
</div>
