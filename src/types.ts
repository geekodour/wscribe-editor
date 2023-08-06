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

export type { SubtitleNodeData, TranscribedData, ExportSegmentData };
