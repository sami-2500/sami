/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Word {
  id: string;
  word: string;
  pos: 'noun' | 'verb' | 'adjective' | 'adverb' | 'other';
  category: string;
  phonetic: string;
  meaning: string;
  example: string;
  exampleTranslation: string;
  isCustom?: boolean;
}

export type MasteryState = 'learning' | 'mastered' | 'unseen';

export interface WordProgress {
  wordId: string;
  mastery: MasteryState;
  starred: boolean;
}

export interface StreakData {
  lastActive: string | null;
  count: number;
}
