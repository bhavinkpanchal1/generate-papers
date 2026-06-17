import { Check, Trash2 } from 'lucide-react';
import type { DraftQuestion, Difficulty, Subject } from '../types/questions';

type QuestionEditorCardProps = {
  question: DraftQuestion;
  index: number;
  onChange: (id: string, changes: Partial<DraftQuestion>) => void;
  onDelete: (id: string) => void;
};

const subjects: Subject[] = ['Math', 'Physics', 'Chemistry'];
const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

export function QuestionEditorCard({ question, index, onChange, onDelete }: QuestionEditorCardProps) {
  return (
    <article className="rounded border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Question {index + 1}</h2>
          <p className="text-xs text-gray-500">{question.source_file || 'Manual import'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={question.approved ? 'Unapprove question' : 'Approve question'}
            title={question.approved ? 'Approved' : 'Approve'}
            onClick={() => onChange(question.id, { approved: !question.approved })}
            className={`inline-flex h-9 w-9 items-center justify-center rounded border ${
              question.approved
                ? 'border-emerald-600 bg-emerald-600 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Check className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Delete question"
            title="Delete"
            onClick={() => onDelete(question.id)}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_220px]">
        <textarea
          value={question.question_html}
          onChange={event => onChange(question.id, { question_html: event.target.value })}
          className="min-h-40 resize-y rounded border border-gray-300 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-gray-900"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <select
            value={question.subject}
            onChange={event => onChange(question.id, { subject: event.target.value as Subject })}
            className="h-10 rounded border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-900"
          >
            {subjects.map(subject => (
              <option key={subject}>{subject}</option>
            ))}
          </select>
          <input
            value={question.chapter}
            onChange={event => onChange(question.id, { chapter: event.target.value })}
            placeholder="Chapter"
            className="h-10 rounded border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-900"
          />
          <select
            value={question.difficulty}
            onChange={event => onChange(question.id, { difficulty: event.target.value as Difficulty })}
            className="h-10 rounded border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-900"
          >
            {difficulties.map(difficulty => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={question.marks}
            onChange={event => onChange(question.id, { marks: Number(event.target.value) })}
            className="h-10 rounded border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-900"
          />
          <input
            value={question.answer}
            onChange={event => onChange(question.id, { answer: event.target.value })}
            placeholder="Answer"
            className="h-10 rounded border border-gray-300 bg-white px-3 text-sm outline-none focus:border-gray-900 sm:col-span-2 lg:col-span-1"
          />
        </div>
      </div>
    </article>
  );
}
