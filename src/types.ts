type SubtitleNodeData = {
  start: number;
  end: number;
  text: string;
  score: number;
  uuid: string;
  words?: WordData[];
  wordsHTML: string;
  offsetEditMode: boolean;
};

type TranscribedData = {
  text: string;
  start: number | string;
  end: number | string;
  score: number;
  words?: WordData[];
};

type WordData = {
  score: number;
  start: number | string;
  end: number | string;
  text: string;
};

type ExportSegmentData = {
  start: number;
  end: number;
  text: string;
};

type SessionMetadata = {
  mediaFileName: { alias: string; value: string };
  mediaTotalDuration: { alias: string; value: string };
  mediaCurrentTimestamp: { alias: string; value: string };
  mediaCurrentPlaybackSpeed: { alias: string; value: string };
  transcriptFileName: { alias: string; value: string };
  transcriptLastTimestamp: { alias: string; value: string };
  totalSegments: { alias: string; value: number };
};

export type {
  SubtitleNodeData,
  TranscribedData,
  ExportSegmentData,
  SessionMetadata,
};
