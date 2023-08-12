import { writable, get, type Writable } from "svelte/store";
import {
  subTitleTrackFromSegmentData,
  segmentToNodeData,
  sanitizeContent,
  SubtitleTrack,
  SubtitleNode,
} from "./utils";
import type { TranscribedData } from "./types";
import sampletranscriptdata from "./assets/wscribe_editor_into.json";
import { nanoid } from "nanoid";

function createErrorStore() {
  const { subscribe, set, update } = writable([]);

  return {
    subscribe,
    set,
    addToList: (error: string) => {
      update((i) => [...i, error]);
    },
  };
}

function createSubtitleTrackStore(track: SubtitleTrack) {
  const { subscribe, update, set } = writable(track);
  return {
    subscribe,
    set,
    appendAfterSegment: (node: SubtitleNode) => {
      resetNodeNextPrev(node);
      update((t) => {
        let s: TranscribedData = {
          score: 1,
          start: node.data.end,
          end: node.maxOffset(),
          text: "placeholder text added after",
          words: [],
        };
        let nd = segmentToNodeData(s);
        t.appendAfterNode(nd, node);
        return t;
      });
    },
    appendBeforeSegment: (node: SubtitleNode) => {
      resetNodeNextPrev(node);
      update((t) => {
        let s: TranscribedData = {
          score: 1,
          start: node.minOffset(),
          end: node.data.start,
          text: "placeholder text added before",
          words: [],
        };
        let nd = segmentToNodeData(s);
        t.appendBeforeNode(nd, node);
        return t;
      });
    },
    removeSegment: (node: SubtitleNode) => {
      node.data.uuid = nanoid();
      if (node.prev) {
        node.prev.data.uuid = nanoid();
      }
      if (node.next) {
        node.next.data.uuid = nanoid();
      }
      update((t) => {
        if (!node.prev) {
          // head
          t.removeFromFront();
        } else if (!node.next) {
          // tail
          t.removeFromBack();
        } else {
          node.yeetSelf();
          t.size--;
        }
        return t;
      });
    },
    toggleEditModeForSegment: (node: SubtitleNode) => {
      node.data.offsetEditMode = !node.data.offsetEditMode;
      resetNodeNextPrev(node, true);
      update((t) => t);
    },
    updateTsForSegment: (
      node: SubtitleNode,
      ts: { start: number; end: number },
    ) => {
      node.data.start = ts.start;
      node.data.end = ts.end;
      resetNodeNextPrev(node);
      update((t) => t);
    },
    resetTrack: (node?: SubtitleNode) => {
      if (node) {
        resetNodeNextPrev(node);
      }
      update((t) => t);
    },
  };
}

// why?
// TODO: Come back to this later and convert into a github issue
// - contenteditable on lage number causes slowness if span inside div, normal text worked fine
// - works on chrome not on ff
// - anyway with immutable=false (default), svelte will render all of the list, not ideal
// - we cannot keep the key just the hash of the content because we want linked
//   nodes to be updated as well when we update current node
// - so we update current, prev and next uuid so that each re-renders only those
//   as that's used as the key
const resetNodeNextPrev = (
  node: SubtitleNode,
  currentNodeOnly: boolean = false,
) => {
  node.data.uuid = nanoid();
  if (!currentNodeOnly) {
    if (node.prev) {
      node.prev.data.uuid = nanoid();
    }
    if (node.next) {
      node.next.data.uuid = nanoid();
    }
  }
};

const rawTranscriptDataStore = writable({});
rawTranscriptDataStore.set(sanitizeContent(sampletranscriptdata));

const errListStore = createErrorStore();
const currentPlaybackTime = writable(0);
const wordLevelData = writable(true);
const scoreView = writable(false);
let subtitleTrackStore: ReturnType<typeof createSubtitleTrackStore>;
let transcriptTrackStore: ReturnType<typeof createSubtitleTrackStore>;
let strack: SubtitleTrack, ttrack: SubtitleTrack;
try {
  [strack, ttrack] = subTitleTrackFromSegmentData(
    get(rawTranscriptDataStore) as TranscribedData[],
  );
  subtitleTrackStore = createSubtitleTrackStore(strack);
  transcriptTrackStore = createSubtitleTrackStore(ttrack);
} catch (e) {
  console.error(e);
  errListStore.addToList(e.message);
}
const waveStore = writable(null);
const mediaStoreURL = writable("/wscribe_editor_intro.mp3");
const isPlayable = writable(false);
const fileInfo = writable({
  mediaFileName: null,
  transcriptFileName: null,
});

export {
  errListStore,
  subtitleTrackStore,
  transcriptTrackStore,
  currentPlaybackTime,
  rawTranscriptDataStore,
  wordLevelData,
  scoreView,
  waveStore,
  mediaStoreURL,
  isPlayable,
  fileInfo,
};
