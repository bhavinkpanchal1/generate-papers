import { FileUp, Loader2, Upload } from 'lucide-react';

type ImportUploaderProps = {
  file: File | null;
  isUploading: boolean;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
};

export function ImportUploader({ file, isUploading, onFileChange, onUpload }: ImportUploaderProps) {
  return (
    <section className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-3 rounded border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center transition hover:border-gray-400 lg:w-[420px]">
          <FileUp className="h-7 w-7 text-gray-600" aria-hidden="true" />
          <span className="text-sm font-medium text-gray-800">
            {file ? file.name : 'Choose an exam PDF'}
          </span>
          <input
            className="sr-only"
            type="file"
            accept="application/pdf"
            onChange={event => onFileChange(event.target.files?.[0] ?? null)}
          />
        </label>

        <button
          type="button"
          onClick={onUpload}
          disabled={!file || isUploading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded bg-gray-900 px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="h-4 w-4" aria-hidden="true" />
          )}
          Upload
        </button>
      </div>
    </section>
  );
}
