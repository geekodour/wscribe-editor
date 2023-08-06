<script lang="ts">
  import svelteLogo from "./assets/svelte.svg";
  import Navbar from "./components/Navbar.svelte";
  import TopEditorBar from "./components/TopEditorBar.svelte";
  import PlayerControl from "./components/PlayerControl.svelte";
  import OptionsActions from "./components/OptionsActions.svelte";
  import MainEditor from "./components/MainEditor.svelte";
  import ErrorList from "./components/ErrorList.svelte";
  import Timeline from "./components/Timeline.svelte";
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
  let transcriptView = false;
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
  <div
    class="flex h-screen max-h-screen flex-col px-4 py-2 2xl:m-auto 2xl:w-4/5"
  >
    <Navbar />
    <div class="flex grow">
      <div class="w-3/4 bg-red-100 px-4">
        <TopEditorBar />
        {#if $errListStore.length === 0}
          <MainEditor {currentTrack} />
        {/if}
      </div>
      <div class="flex w-1/4 flex-col">
        <div class="grow bg-amber-100">
          <PlayerControl />
          <ErrorList errList={$errListStore} />
        </div>
        <div class="bg-lime-100 py-12">
          <OptionsActions
            {toggleTranscriptView}
            {toggleScoreView}
            {transcriptView}
            scoreView={$scoreView}
          />
        </div>
      </div>
    </div>
    <div class="bg-black text-white">
      <Timeline />
    </div>
  </div>
</main>
