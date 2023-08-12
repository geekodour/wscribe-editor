<script lang="ts">
  export let transcriptView;
  import {
    rawTranscriptDataStore,
    subtitleTrackStore,
    transcriptTrackStore,
    errListStore,
    wordLevelData,
    fileInfo,
  } from "../store";
  import {
    subTitleTrackFromSegmentData,
    SubtitleTrack,
    fileParseFn,
    sanitizeContent,
  } from "../utils";
  import type { TranscribedData } from "../types";
  import { exportFormatsFn, exportStuff, trackToList } from "../utils";

  const exportFile = (format: string) => {
    if (transcriptView) {
      exportStuff(format, trackToList($transcriptTrackStore), transcriptView);
    } else {
      exportStuff(format, trackToList($subtitleTrackStore), transcriptView);
    }
  };

  async function handleTranscriptSelect(event) {
    try {
      errListStore.set([]);
      const selectedTranscript = event.target.files[0];
      let content = await selectedTranscript.text();
      const parseFn = fileParseFn(selectedTranscript.name);
      rawTranscriptDataStore.set(sanitizeContent(parseFn(content)));
      wordLevelData.set("words" in $rawTranscriptDataStore[0]);
      fileInfo.update((e) => ({
        ...e,
        transcriptFileName: selectedTranscript.name,
      }));

      let strack: SubtitleTrack, ttrack: SubtitleTrack;
      [strack, ttrack] = subTitleTrackFromSegmentData(
        $rawTranscriptDataStore as TranscribedData[],
      );
      subtitleTrackStore.set(strack);
      transcriptTrackStore.set(ttrack);
    } catch (e) {
      console.error(e);
      errListStore.addToList(e.message);
    }
  }

  let showDropDown = false;
  const toggleDropDown = () => {
    showDropDown = !showDropDown;
  };
</script>

<header class="px-8">
  <div class="flex h-16 items-center justify-between">
    <div class="flex-1 flex items-center gap-6">
      <input
        class="hidden"
        id="transcriptfile"
        type="file"
        accept=".json,.srt,.vtt"
        on:change={handleTranscriptSelect}
      />
      <label
        for="transcriptfile"
        class="cursor-pointer inline-flex justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >Load Transcript</label
      >
      <label
        for="media"
        class="cursor-pointer inline-flex justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >Load Media</label
      >
    </div>

    <div class="flex items-center gap-12">
      <div class="flex items-center gap-4">
        <!-- Dropdown -->
        <div class="relative inline-block text-left">
          <div>
            <button
              type="button"
              class="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              id="menu-button"
              on:click={toggleDropDown}
              aria-expanded="true"
              aria-haspopup="true"
            >
              Export
            </button>
          </div>
          {#if showDropDown}
            <div
              class="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="menu-button"
              tabindex="-1"
            >
              <div class="py-1" role="none">
                {#each Object.keys(exportFormatsFn) as f}
                  <a
                    class="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
                    on:click={() => {
                      exportFile(f);
                    }}>{f}</a
                  >
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</header>
