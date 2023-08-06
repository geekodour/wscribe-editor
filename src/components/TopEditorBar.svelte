<script lang="ts">
  import {
    rawTranscriptDataStore,
    subtitleTrackStore,
    transcriptTrackStore,
    errListStore,
    wordLevelData,
  } from "../store";
  import {
    subTitleTrackFromSegmentData,
    SubtitleTrack,
    fileParseFn,
    sanitizeContent,
  } from "../utils";
  import type { TranscribedData } from "../types";
  async function handleTranscriptSelect(event) {
    try {
      errListStore.set([]);
      const selectedTranscript = event.target.files[0];
      let content = await selectedTranscript.text();
      const parseFn = fileParseFn(selectedTranscript.name);
      rawTranscriptDataStore.set(sanitizeContent(parseFn(content)));
      wordLevelData.set("words" in $rawTranscriptDataStore[0]);

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
</script>

<div class="flex justify-end gap-2">
  <input
    class="hidden"
    id="transcriptfile"
    type="file"
    accept=".json,.srt,.vtt"
    on:change={handleTranscriptSelect}
  />
  <label
    for="transcriptfile"
    class="uppercase px-6 py-1 hover:bg-black hover:text-white border-black border-2 cursor-pointer"
    >Load Transcript</label
  >

  <label
    for="media"
    class="uppercase px-6 py-1 hover:bg-black hover:text-white border-black border-2 cursor-pointer"
    >Load Media</label
  >
</div>
