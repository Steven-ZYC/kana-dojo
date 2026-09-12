import { describe, expect, it } from 'vitest';
import {
  createMistakeId,
  parseMistakeBook,
  recordMistake,
  recordReviewSuccess,
  serializeMistakeBook,
  type MistakeAttempt,
} from './mistakeBook';

const baseAttempt: MistakeAttempt = {
  id: createMistakeId('sa-shi-し', 'hira', 'kana-romaji'),
  itemKey: 'sa-shi-し',
  script: 'hira',
  mode: 'kana-romaji',
  answer: 'siu',
};

describe('mistake book', () => {
  it('keeps script and direction variants as separate records', () => {
    const first = recordMistake([], baseAttempt, '2026-09-12T00:00:00.000Z');
    const second = recordMistake(
      first,
      {
        ...baseAttempt,
        id: createMistakeId('sa-shi-し', 'kata', 'kana-romaji'),
        script: 'kata',
      },
      '2026-09-12T00:01:00.000Z',
    );

    expect(second).toHaveLength(2);
  });

  it('increments the error count and replaces the last answer', () => {
    const first = recordMistake([], baseAttempt, '2026-09-12T00:00:00.000Z');
    const second = recordMistake(
      first,
      { ...baseAttempt, answer: 'chi' },
      '2026-09-12T00:01:00.000Z',
    );

    expect(second[0]).toMatchObject({ wrongCount: 2, lastWrongAnswer: 'chi' });
  });

  it('marks a record mastered after two consecutive review successes', () => {
    const wrong = recordMistake([], baseAttempt);
    const firstSuccess = recordReviewSuccess(wrong, baseAttempt.id);
    const secondSuccess = recordReviewSuccess(firstSuccess, baseAttempt.id);

    expect(firstSuccess[0]).toMatchObject({
      reviewCorrectStreak: 1,
      mastered: false,
    });
    expect(secondSuccess[0]).toMatchObject({
      wrongCount: 1,
      reviewCorrectStreak: 2,
      mastered: true,
    });
  });

  it('reopens a mastered record after another wrong answer', () => {
    const wrong = recordMistake([], baseAttempt);
    const mastered = recordReviewSuccess(
      recordReviewSuccess(wrong, baseAttempt.id),
      baseAttempt.id,
    );
    const reopened = recordMistake(mastered, baseAttempt);

    expect(reopened[0]).toMatchObject({
      wrongCount: 2,
      reviewCorrectStreak: 0,
      mastered: false,
    });
  });

  it('round-trips valid records and ignores damaged storage', () => {
    const records = recordMistake([], baseAttempt);

    expect(parseMistakeBook(serializeMistakeBook(records))).toEqual(records);
    expect(parseMistakeBook('{broken')).toEqual([]);
    expect(parseMistakeBook(JSON.stringify({ version: 99, records }))).toEqual(
      [],
    );
  });

  it('drops records whose identifier or mastery state was tampered with', () => {
    const record = recordMistake([], baseAttempt)[0];
    const tampered = [
      { ...record, id: 'not-the-derived-id' },
      { ...record, mastered: true },
    ];

    expect(
      parseMistakeBook(JSON.stringify({ version: 1, records: tampered })),
    ).toEqual([]);
  });
});
