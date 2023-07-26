import { describe, expect, it } from "vitest";
import {
  msToTimestamp,
  timestampToMs,
  subtitleToTranscriptGroups,
  segmentToNodeData,
  SubtitleTrack,
  SubtitleNode,
  trackToList,
  exportFormatsFn,
} from "../src/utils";
import type { TranscribedData } from "../src/types";

const lines: TranscribedData[] = [
  {
    score: 0.9,
    start: 0,
    end: 3,
    text: "abc xyz",
    words: [
      { score: 0.9, start: 0, end: 1, text: "abc" },
      { score: 0.9, start: 1, end: 3, text: "xyz" },
    ],
  },
  {
    score: 0.7,
    start: 3,
    end: 6,
    text: "123 456",
    words: [
      { score: 0.9, start: 3, end: 4, text: "123" },
      { score: 0.9, start: 4, end: 6, text: "456" },
    ],
  },
];

describe("timestamp conversions", () => {
  it.each([
    { timestamp: "00:00.998", error: true },
    { timestamp: "00:00:00.998", exp: 998 },
  ])("timestampToMs($timestamp)", ({ timestamp, exp, error }) => {
    if (error) {
      expect(() => timestampToMs(timestamp)).toThrowError();
    } else {
      expect(timestampToMs(timestamp)).toStrictEqual(exp);
    }
  });

  it.each([{ exp: "00:00:00.998", ms: 998 }])(
    "msToTimestamp($ms)",
    ({ ms, exp }) => {
      expect(msToTimestamp(ms)).toStrictEqual(exp);
    },
  );
});

describe("subtitle to transcript", () => {
  it("groups by line chunk", () => {
    const exp: TranscribedData[] = [
      {
        text: "abc xyz 123 456",
        score: 0.8,
        start: 0,
        end: 6,
        words: [
          { score: 0.9, start: 0, end: 1, text: "abc" },
          { score: 0.9, start: 1, end: 3, text: "xyz" },
          { score: 0.9, start: 3, end: 4, text: "123" },
          { score: 0.9, start: 4, end: 6, text: "456" },
        ],
      },
    ];
    expect(subtitleToTranscriptGroups(lines)).toStrictEqual(exp);
  });
});

describe("adding and removing nodes from SubtitleTrack", () => {
  it("Adding and Removing", () => {
    const track = new SubtitleTrack();
    for (let s of [
      ...lines,
      { ...lines[0], start: 10, end: 15 },
      ...lines,
      ...lines,
    ]) {
      let nd = segmentToNodeData(s);
      track.append(nd);
    }
    expect(track.size).toBe(7);
    track.removeFromFront();
    track.removeFromFront();
    track.removeFromBack();

    expect(track.size).toBe(4);

    const freshNodeData = segmentToNodeData({ ...lines[0], start: 8, end: 10 });
    const pickedNode = track.iterate().next().value as SubtitleNode;
    track.appendBeforeNode(freshNodeData, pickedNode);
    expect(track.size).toBe(5);
    {
      pickedNode.yeetSelf();
      track.size--; // see definition of yeetSelf
    }
    expect(track.size).toBe(4);
  });
});

describe("export stuff", () => {
  const track = new SubtitleTrack();
  for (let s of lines) {
    let nd = segmentToNodeData(s);
    track.append(nd);
  }
  it("track is transformed into exportable structure", () => {
    const exp = [
      { start: 0, end: 3, text: "abc xyz" },
      { start: 3, end: 6, text: "123 456" },
    ];
    expect(trackToList(track)).toStrictEqual(exp);
  });

  it.each(["json", "srt", "vtt", "plaintext"])("%s", (format) => {
    const fn = exportFormatsFn[format.toUpperCase()];
    expect(fn(trackToList(track))).toMatchFileSnapshot(
      `./goldens/${format}_formatted_string_data`,
    );
  });
});
