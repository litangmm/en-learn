import { Dictionary } from './types';

export const dictionaries: Dictionary[] = [
  { id: 'junior', name: '初中词汇', description: '初中英语核心词汇', sentenceCount: 1600 },
  { id: 'senior', name: '高中词汇', description: '高中英语核心词汇', sentenceCount: 2000 },
  { id: 'cet4', name: 'CET-4', description: '大学英语四级核心词汇', sentenceCount: 1500 },
  { id: 'cet6', name: 'CET-6', description: '大学英语六级核心词汇', sentenceCount: 1500 },
  { id: 'ielts', name: '雅思', description: '雅思考试核心词汇', sentenceCount: 2000 },
  { id: 'toefl', name: '托福', description: '托福考试核心词汇', sentenceCount: 2000 },
  { id: 'gre', name: 'GRE', description: 'GRE考试核心词汇', sentenceCount: 3000 },
];

export function getDictionaryById(id: string): Dictionary | undefined {
  return dictionaries.find(d => d.id === id);
}
