import type {
  ExportSegmentData,
  SubtitleNodeData,
  TranscribedData,
  SessionMetadata,
} from "./types";

import { parse as subtitleparser } from "@plussub/srt-vtt-parser";
import { nanoid } from "nanoid";

function timestampToMs(timestamp: string) {
  const [time, milliseconds] = timestamp.split(".");
  const [hours, minutes, seconds] = time.split(":").map(parseFloat);

  // sometimes hours might be abset, we currently don't handle that case
  // in those case, it's just 00:00.000, i.e seconds will be missing
  if (seconds === undefined) {
    throw new Error("expected ts 00:00:00.000");
  }

  const totalMs =
    hours * 3_600_000 + // 1 hour = 3600 seconds = 3600000 milliseconds
    minutes * 60_000 + // 1 minute = 60 seconds = 60000 milliseconds
    seconds * 1_000 + // 1 second = 1000 milliseconds
    parseFloat(milliseconds);

  return totalMs;
}

function msToTimestamp(
  ms: number,
  decimal_marker: string = ".",
  trimMs: boolean = false,
): string {
  const hours = Math.floor(ms / 3_600_000);
  ms -= hours * 3_600_000;

  const minutes = Math.floor(ms / 60_000);
  ms -= minutes * 60_000;

  const seconds = Math.floor(ms / 1_000);
  ms -= seconds * 1_000;
  ms = trimMs ? parseFloat(ms.toFixed(0)) : ms;

  return `${stringPad(hours)}:${stringPad(minutes)}:${stringPad(
    seconds,
  )}${decimal_marker}${stringPad(ms, 3)}`;
}

function stringPad(n: number, padding: number = 2): string {
  return String(n).padStart(padding, "0");
}

class SubtitleNode {
  public data: SubtitleNodeData;
  public prev: SubtitleNode | null;
  public next: SubtitleNode | null;

  constructor(data: SubtitleNodeData) {
    this.data = data;
    this.prev = null;
    this.next = null;
  }

  public prePause(): number {
    if (!this.prev) {
      return this.data.start - 0;
    }
    return this.data.start - this.prev.data.end;
  }

  public postPause(): number {
    if (!this.next) {
      return Number.MAX_SAFE_INTEGER;
    }
    return this.next.data.start - this.data.end;
  }

  public minOffset(): number {
    return this.data.start - this.prePause();
  }

  public maxOffset(): number {
    return this.data.end + this.postPause();
  }

  // does not handle head/tail and list size
  // these are supposed to be handled externally in this case
  public yeetSelf(): void {
    this.prev.next = this.next;
    this.next.prev = this.prev;
    this.prev = null;
    this.next = null;
  }
}

class SubtitleTrack {
  private head: SubtitleNode | null;
  private tail: SubtitleNode | null;
  public size: number;

  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  public append(data: SubtitleNodeData): void {
    const newNode = new SubtitleNode(data);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.prev = this.tail;
      this.tail!.next = newNode;
      this.tail = newNode;
    }
    this.size++;
  }

  public appendBeforeNode(data: SubtitleNodeData, node: SubtitleNode): void {
    if (node.prePause() <= 0) {
      throw new Error("no space");
    }
    const newNode = new SubtitleNode(data);
    if (
      !(
        newNode.data.start >= node.minOffset() &&
        newNode.data.end <= node.data.start
      )
    ) {
      throw new Error("impossible timestamps");
    }
    if (!node.prev) {
      // head
      newNode.next = node;
      newNode.prev = null;
      node.prev = newNode;
      this.head = newNode;
    } else {
      newNode.next = node;
      newNode.prev = node.prev;
      node.prev.next = newNode;
      node.prev = newNode;
    }
    this.size++;
  }

  public appendAfterNode(data: SubtitleNodeData, node: SubtitleNode): void {
    if (node.postPause() <= 0) {
      throw new Error("no space");
    }
    const newNode = new SubtitleNode(data);
    if (
      !(
        newNode.data.start >= node.data.end &&
        newNode.data.end <= node.maxOffset()
      )
    ) {
      throw new Error("impossible timestamps");
    }
    if (!node.next) {
      // tail
      newNode.next = null;
      newNode.prev = node;
      node.next = newNode;
      this.tail = newNode;
    } else {
      newNode.next = node.next;
      newNode.prev = node;
      node.next.prev = newNode;
      node.next = newNode;
    }
    this.size++;
  }

  public removeFromFront(): void {
    if (!this.head) {
      return;
    }
    if (!this.head.next) {
      // only one node in the track
      this.head = null;
      this.tail = null;
    } else {
      let newHead = this.head.next;
      newHead.prev = null;
      this.head.next = null;
      this.head = newHead;
    }
    this.size--;
  }
  public removeFromBack(): void {
    if (!this.tail) {
      return;
    }
    if (!this.tail.prev) {
      // only one node in the track
      this.head = null;
      this.tail = null;
    } else {
      let newTail = this.tail.prev;
      newTail.next = null;
      this.tail.prev = null;
      this.tail = newTail;
    }
    this.size--;
  }

  public *iterate(): Iterator<SubtitleNode, void, SubtitleNode> {
    let current = this.head;
    while (current) {
      yield current;
      current = current.next;
    }
  }
}

// As of the moment this function only support chunking lines, might add support
// for other if needed. Possible groupings by Speaker(if Diarization), time,
// break in dialogue, chapters, number of segments/lines chunks etc.
function subtitleToTranscriptGroups(s: TranscribedData[]): TranscribedData[] {
  // Make chunks
  const chunkSize = 10;
  let chunkedSegmentData = s.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / chunkSize);
    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [];
    }
    resultArray[chunkIndex].push(item);
    return resultArray;
  }, []);

  return chunkedSegmentData.map((p: TranscribedData[]) => {
    // let res = { text: "", score: 0, start: 0, end: 0, words: [] };
    let res: TranscribedData = {
      text: p
        .reduce((t: string, i: TranscribedData) => t + " " + i.text, "")
        .trim(),
      start: p[0].start,
      end: p[p.length - 1].end,
      score: parseFloat(
        (
          p.reduce((n: number, i: TranscribedData) => n + i.score, 0) / p.length
        ).toFixed(2),
      ),
      words: p[0].words
        ? p.reduce((t: any[], i: TranscribedData) => [...t, ...i.words], [])
        : null,
    };
    return res;
  });
}

const wordColor = (score: number) => {
  if (score <= 30) {
    return "bg-orange-400";
  } else if (score <= 50) {
    return "bg-orange-300";
  } else if (score <= 70) {
    return "bg-orange-200";
  } else if (score <= 80) {
    return "bg-orange-100";
  }
  return "alwaysonthego"; // just about anything
};

function segmentToNodeData(s: TranscribedData): SubtitleNodeData {
  return {
    score: s.score,
    start: s.start as number,
    end: s.end as number,
    text: s.text,
    uuid: nanoid(),
    words: s.words,
    offsetEditMode: false,
    wordsHTML: s.words
      ? s.words
          .map(
            (w) =>
              `<span data-start=${w.start} data-end=${w.end} data-score=${w.score}>${w.text}</span>`,
          )
          .join(" ")
      : `${s.text}`,
  };
}

function decodeToMs(data: TranscribedData[]) {
  for (let s of data) {
    if (typeof s.start == "number") {
      // very weak check to determine if input has numeric timestamps
      return;
    }
    s.start = timestampToMs(s.start as string);
    s.end = timestampToMs(s.end as string);
    if (s.words) {
      for (let w of s.words) {
        w.start = timestampToMs(w.start as string);
        w.end = timestampToMs(w.end as string);
      }
    }
  }
}

// verify input is ordered i.e all n.end < (n+1).start
// NOTE: There is a bug in here that it'll skip the last segment for
// start-end check but i'll let it live for now. bug lives matter.
function verifyInputOrder(data: any) {
  for (let i = 0; i < data.length - 1; i++) {
    if (data[i].start > data[i].end) {
      throw new Error("segment start-end");
    }
    if (data[i].end > data[i + 1].start) {
      throw new Error("input order");
    }
  }
}

const subTitleTrackFromSegmentData = (
  data: TranscribedData[],
): [SubtitleTrack, SubtitleTrack] => {
  const tdata = structuredClone(data);
  const sdata = structuredClone(data);

  const ttrack = new SubtitleTrack();
  const strack = new SubtitleTrack();

  // subtitle track
  for (let s of sdata) {
    let nd = segmentToNodeData(s);
    strack.append(nd);
  }

  // transcript track
  for (let s of subtitleToTranscriptGroups(tdata)) {
    let nd = segmentToNodeData(s);
    ttrack.append(nd);
  }
  return [strack, ttrack];
};

const formatJSON = (data: ExportSegmentData[]): [string, string] => {
  return [
    JSON.stringify(
      data.map((d) => {
        return {
          ...d,
          start: msToTimestamp(d.start),
          end: msToTimestamp(d.end),
        };
      }),
    ),
    "json",
  ];
};

const formatSRT = (data: ExportSegmentData[]): [string, string] => {
  return [
    data.reduce((a, v, i) => {
      return (
        a +
        `${i + 1}\n${msToTimestamp(v.start, ",")} --> ${msToTimestamp(
          v.end,
          ",",
        )}\n${v.text}\n\n`
      );
    }, ""),
    "srt",
  ];
};

const formatVTT = (data: ExportSegmentData[]): [string, string] => {
  return [
    "WEBVTT\n\n" +
      data.reduce((a, v, i) => {
        return (
          a +
          `${i + 1}\n${msToTimestamp(v.start)} --> ${msToTimestamp(v.end)}\n${
            v.text
          }\n\n`
        );
      }, ""),
    "vtt",
  ];
};
const formatPlaintext = (data: ExportSegmentData[]): [string, string] => {
  return [
    data.reduce((a, v) => {
      return (
        a +
        `* ${msToTimestamp(v.start)} - ${msToTimestamp(v.end)}\n${v.text}\n\n`
      );
    }, ""),
    "txt",
  ];
};
const exportFormatsFn = {
  PLAINTEXT: formatPlaintext,
  JSON: formatJSON,
  SRT: formatSRT,
  VTT: formatVTT,
};
const exportStuff = (
  format: string,
  data: ExportSegmentData[],
  transcriptExport: boolean,
): void => {
  const fn = exportFormatsFn[format.toUpperCase()];
  if (!fn) {
    throw new Error("unsupported format");
  }

  let formattedData: string, fileExt: string;
  [formattedData, fileExt] = fn(data);
  const blob = new Blob([formattedData], { type: "text/plain" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName(fileExt, transcriptExport);
  link.click();
};

const trackToList = (track: SubtitleTrack): ExportSegmentData[] => {
  let arr = [];
  for (let i of track.iterate() as unknown as Iterable<SubtitleNode>) {
    let div = document.createElement("div");
    div.innerHTML = i.data.wordsHTML.replace(/<br>/g, "\n");
    arr.push({ start: i.data.start, end: i.data.end, text: div.innerText });
  }
  return arr;
};

const fileName = (ext: string, transcriptExport: boolean): string => {
  const prefix = `wscribe_${transcriptExport ? "transcript" : "sub"}`;
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${prefix}_${year}_${month}_${day}_${hours}_${minutes}_${seconds}.${ext}`;
};

const fileParseFn = (fileName: string): any => {
  let ext = fileName.split(".")[1]; // assuming filename.ext
  switch (ext) {
    case "json":
      return JSON.parse;
    case "srt":
      return (content: any) => {
        let parsed = subtitleparser(content);
        return parsed.entries.map((e) => ({
          start: e.from,
          end: e.to,
          text: e.text,
        }));
      };
    case "vtt":
      return (content: any) => {
        let parsed = subtitleparser(content);
        return parsed.entries.map((e) => ({
          start: e.from,
          end: e.to,
          text: e.text,
        }));
      };
    default:
      throw new Error("unsupported format");
  }
};

const newSessionMetadata = (
  mediaFileName: string,
  transcriptFileName: string,
  mediaTotalDuration: string,
  transcriptLastTimestamp: string,
  mediaCurrentTimestamp: string,
  mediaCurrentPlaybackSpeed: string,
  totalSegments: number,
): SessionMetadata => {
  return {
    mediaFileName: { alias: "MED", value: mediaFileName },
    transcriptFileName: { alias: "TRA", value: transcriptFileName },
    mediaTotalDuration: { alias: "EOM", value: mediaTotalDuration },
    transcriptLastTimestamp: { alias: "EOT", value: transcriptLastTimestamp },
    mediaCurrentTimestamp: { alias: "CUR", value: mediaCurrentTimestamp },
    mediaCurrentPlaybackSpeed: {
      alias: "SPD",
      value: mediaCurrentPlaybackSpeed,
    },
    totalSegments: { alias: "SEG", value: totalSegments },
  };
};

const sanitizeContent = (data: TranscribedData[]): TranscribedData[] => {
  decodeToMs(data);
  verifyInputOrder(data);
  return data;
};

export {
  msToTimestamp,
  timestampToMs,
  wordColor,
  segmentToNodeData,
  subtitleToTranscriptGroups,
  exportFormatsFn,
  newSessionMetadata,
  fileParseFn,
  sanitizeContent,
  trackToList,
  exportStuff,
  SubtitleTrack,
  SubtitleNode,
  subTitleTrackFromSegmentData,
};
