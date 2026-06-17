import { useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { ImportUploader } from '../components/ImportUploader';
import { QuestionEditorCard } from '../components/QuestionEditorCard';
import { api } from '../lib/api';
import type { DraftQuestion } from '../types/questions';

type UploadQuestion = {
  question_html: string;
  question_latex?: string;
  answer?: string;
  source_file?: string;
};

function toDraftQuestion(question: UploadQuestion, index: number, sourceFile: string): DraftQuestion {
  return {
    id: `${Date.now()}-${index}`,
    subject: 'Math',
    chapter: '',
    difficulty: 'easy',
    question_html: question.question_html,
    question_latex: question.question_latex || '',
    answer: question.answer || '',
    marks: 1,
    source_file: question.source_file || sourceFile,
    approved: false
  };
}

export function ImportQuestions() {
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const approvedCount = useMemo(
    () => questions.filter(question => question.approved).length,
    [questions]
  );

  async function uploadPdf() {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('/upload', formData);
      const imported = response.data.questions.map((question: UploadQuestion, index: number) =>
        toDraftQuestion(question, index, response.data.source_file)
      );
      setQuestions(imported);
      setMessage(`${imported.length} questions ready for review`);
    } catch (uploadError: any) {
      setError(uploadError.response?.data?.message || 'Could not import this PDF');
    } finally {
      setIsUploading(false);
    }
  }

  async function saveApproved() {
    const approved = questions.filter(question => question.approved);
    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      await api.post('/questions', {
        questions: approved.map(({ id, approved: _approved, ...question }) => question)
      });
      setQuestions(current => current.filter(question => !question.approved));
      setMessage(`${approved.length} approved questions saved`);
    } catch (saveError: any) {
      setError(saveError.response?.data?.message || 'Could not save approved questions');
    } finally {
      setIsSaving(false);
    }
  }

  function updateQuestion(id: string, changes: Partial<DraftQuestion>) {
    setQuestions(current =>
      current.map(question => (question.id === id ? { ...question, ...changes } : question))
    );
  }

  function deleteQuestion(id: string) {
    setQuestions(current => current.filter(question => question.id !== id));
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-semibold text-gray-950">Import Questions</h1>
          <p className="mt-1 text-sm text-gray-600">Upload a PDF, review extracted questions, and save approved items.</p>
        </div>
      </header>

      <ImportUploader file={file} isUploading={isUploading} onFileChange={setFile} onUpload={uploadPdf} />

      <section className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <div className="mb-4 flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-3 gap-2 text-center sm:w-[360px]">
            <div className="rounded border border-gray-200 bg-white px-3 py-2">
              <div className="text-lg font-semibold text-gray-950">{questions.length}</div>
              <div className="text-xs text-gray-500">Imported</div>
            </div>
            <div className="rounded border border-gray-200 bg-white px-3 py-2">
              <div className="text-lg font-semibold text-gray-950">{approvedCount}</div>
              <div className="text-xs text-gray-500">Approved</div>
            </div>
            <div className="rounded border border-gray-200 bg-white px-3 py-2">
              <div className="text-lg font-semibold text-gray-950">{questions.length - approvedCount}</div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
          </div>

          <button
            type="button"
            onClick={saveApproved}
            disabled={approvedCount === 0 || isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Save Approved
          </button>
        </div>

        {message && <p className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
        {error && <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

        <div className="grid gap-4">
          {questions.map((question, index) => (
            <QuestionEditorCard
              key={question.id}
              question={question}
              index={index}
              onChange={updateQuestion}
              onDelete={deleteQuestion}
            />
          ))}
          {questions.length === 0 && (
            <div className="rounded border border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-500">
              No imported questions yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
