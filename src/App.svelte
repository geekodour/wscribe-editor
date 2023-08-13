<script lang="ts">
  import Navbar from "./components/Navbar.svelte";
  import PlayerControl from "./components/PlayerControl.svelte";
  import OptionsActions from "./components/OptionsActions.svelte";
  import MainEditor from "./components/MainEditor.svelte";
  import ErrorList from "./components/ErrorList.svelte";
  import Timeline from "./components/Timeline.svelte";
  import BottomPlayer from "./components/BottomPlayer.svelte";
  import {
    subtitleTrackStore,
    errListStore,
    transcriptTrackStore,
    scoreView,
  } from "./store";

  // NOTE: Not a fan of how I have to run resetTrack because it's a generator
  // under the hood, but don't have any better options in my mind right now
  // NOTE: Not a big fan of how I am splitting the view toggle for scoreView and
  // transcriptView into store based and component based toggles. Not ideal.
  // Maybe refactor everything to store, so current naming convention sucks
  let transcriptView = true;
  const toggleScoreView = () => {
    $scoreView = !$scoreView;
    currentTrack.resetTrack();
  };
  const toggleTranscriptView = () => {
    transcriptView = !transcriptView;
    currentTrack.resetTrack();
  };
  $: currentTrack = transcriptView ? transcriptTrackStore : subtitleTrackStore;
</script>

<main>
  <div class="flex h-screen max-h-screen flex-col 2xl:m-auto font-body">
    <div class="bg-zinc-50">
      <Navbar {transcriptView} />
    </div>
    <div class="flex grow">
      <div class="w-3/4 px-4 flex flex-col justify-around">
        {#if $errListStore.length === 0}
          <MainEditor {currentTrack} />
          <BottomPlayer />
        {/if}
      </div>
      <div class="flex w-1/4 flex-col">
        <div class="grow bg-zinc-100">
          <PlayerControl {currentTrack} />
          <ErrorList errList={$errListStore} />
        </div>
        <div class="bg-zinc-200 py-12">
          <OptionsActions
            {toggleTranscriptView}
            {toggleScoreView}
            {transcriptView}
            scoreView={$scoreView}
          />
        </div>
      </div>
    </div>
    <div class="bg-zinc-600 text-white">
      <Timeline />
    </div>
  </div>
</main>
