export type Subject = 'Math' | 'Physics' | 'Chemistry';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type DraftQuestion = {
  id: string;
  subject: Subject;
  chapter: string;
  difficulty: Difficulty;
  question_html: string;
  question_latex: string;
  answer: string;
  marks: number;
  source_file: string;
  approved: boolean;
};
