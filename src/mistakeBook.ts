export type MistakeScript = 'hira' | 'kata';
export type MistakeMode = 'kana-romaji' | 'romaji-kana';

export type MistakeRecord = {
  id: string;
  itemKey: string;
  script: MistakeScript;
  mode: MistakeMode;
  wrongCount: number;
  reviewCorrectStreak: number;
  mastered: boolean;
  lastWrongAnswer: string;
  lastWrongAt: string;
  lastReviewedAt?: string;
};

export type MistakeAttempt = Pick<
  MistakeRecord,
  'id' | 'itemKey' | 'script' | 'mode'
> & {
  answer: string;
};

export const MISTAKE_BOOK_STORAGE_KEY = 'kana-dojo-mistakes-v1';
export const MISTAKE_BOOK_VERSION = 1;

export function createMistakeId(
  itemKey: string,
  script: MistakeScript,
  mode: MistakeMode,
) {
  return `${mode}:${script}:${itemKey}`;
}

export function recordMistake(
  records: MistakeRecord[],
  attempt: MistakeAttempt,
  timestamp = new Date().toISOString(),
) {
  const existingIndex = records.findIndex((record) => record.id === attempt.id);
  if (existingIndex === -1) {
    return [
      ...records,
      {
        id: attempt.id,
        itemKey: attempt.itemKey,
        script: attempt.script,
        mode: attempt.mode,
        wrongCount: 1,
        reviewCorrectStreak: 0,
        mastered: false,
        lastWrongAnswer: attempt.answer,
        lastWrongAt: timestamp,
      },
    ];
  }

  return records.map((record, index) =>
    index === existingIndex
      ? {
          ...record,
          wrongCount: record.wrongCount + 1,
          reviewCorrectStreak: 0,
          mastered: false,
          lastWrongAnswer: attempt.answer,
          lastWrongAt: timestamp,
        }
      : record,
  );
}

export function recordReviewSuccess(
  records: MistakeRecord[],
  id: string,
  timestamp = new Date().toISOString(),
) {
  return records.map((record) => {
    if (record.id !== id) return record;
    const reviewCorrectStreak = Math.min(2, record.reviewCorrectStreak + 1);
    return {
      ...record,
      reviewCorrectStreak,
      mastered: reviewCorrectStreak >= 2,
      lastReviewedAt: timestamp,
    };
  });
}

export function parseMistakeBook(raw: string | null): MistakeRecord[] {
  if (!raw) return [];

  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== MISTAKE_BOOK_VERSION) return [];
    if (!Array.isArray(value.records)) return [];

    const uniqueRecords = new Map<string, MistakeRecord>();
    for (const candidate of value.records) {
      if (isMistakeRecord(candidate))
        uniqueRecords.set(candidate.id, candidate);
    }
    return [...uniqueRecords.values()];
  } catch {
    return [];
  }
}

export function serializeMistakeBook(records: MistakeRecord[]) {
  return JSON.stringify({ version: MISTAKE_BOOK_VERSION, records });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isMistakeRecord(value: unknown): value is MistakeRecord {
  if (!isRecord(value)) return false;
  if (
    typeof value.itemKey !== 'string' ||
    (value.script !== 'hira' && value.script !== 'kata') ||
    (value.mode !== 'kana-romaji' && value.mode !== 'romaji-kana')
  ) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    value.id === createMistakeId(value.itemKey, value.script, value.mode) &&
    Number.isInteger(value.wrongCount) &&
    Number(value.wrongCount) > 0 &&
    Number.isInteger(value.reviewCorrectStreak) &&
    Number(value.reviewCorrectStreak) >= 0 &&
    Number(value.reviewCorrectStreak) <= 2 &&
    typeof value.mastered === 'boolean' &&
    value.mastered === Number(value.reviewCorrectStreak) >= 2 &&
    typeof value.lastWrongAnswer === 'string' &&
    typeof value.lastWrongAt === 'string' &&
    (value.lastReviewedAt === undefined ||
      typeof value.lastReviewedAt === 'string')
  );
}
