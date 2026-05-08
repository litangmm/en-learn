export interface Blank {
  word: string;
  hint?: string;
}

export interface Sentence {
  id: string;
  english: string;
  chinese: string;
  blanks: Blank[];
  level: string;
}

export interface Dictionary {
  id: string;
  name: string;
  description: string;
  sentenceCount: number;
}
