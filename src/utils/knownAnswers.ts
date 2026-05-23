import type { QuestionHistoryEntry } from '../types';

export interface KnownAnswer {
  turnNumber: number;
  question: string;
  answer: boolean;
  askerName: string;
}

export function buildKnownAnswersByPlayer(
  history: QuestionHistoryEntry[],
): Record<string, { name: string; answers: KnownAnswer[] }> {
  const result: Record<string, { name: string; answers: KnownAnswer[] }> = {};

  for (const entry of history) {
    if (entry.blocked) continue;
    for (const [pid, val] of Object.entries(entry.answers)) {
      if (!result[pid]) {
        result[pid] = {
          name: entry.answerNames?.[pid] ?? pid,
          answers: [],
        };
      }
      result[pid].answers.push({
        turnNumber: entry.turnNumber,
        question: entry.attributeLabel,
        answer: val,
        askerName: entry.askerName,
      });
    }
  }

  return result;
}
