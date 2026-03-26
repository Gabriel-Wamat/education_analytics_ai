import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import { FileUp, UploadCloud } from "lucide-react";

import { cn } from "@/lib/cn";

interface DropzoneProps {
  label: string;
  description: string;
  file?: File | null;
  accept?: string;
  onFileSelect: (file: File | null) => void;
}

export const Dropzone = ({
  label,
  description,
  file,
  accept = ".csv,text/csv",
  onFileSelect
}: DropzoneProps) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const helperText = useMemo(
    () => (file ? `${file.name} • ${(file.size / 1024).toFixed(1)} KB` : description),
    [description, file]
  );

  const handleFiles = (fileList: FileList | null) => {
    const nextFile = fileList?.[0] ?? null;
    onFileSelect(nextFile);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <button
      type="button"
      className={cn(
        "group w-full rounded-2xl border border-dashed px-5 py-6 text-left transition",
        dragging
          ? "border-accent/50 bg-sky-50/80"
          : "border-slate-200 bg-white hover:border-accent/40 hover:bg-slate-50"
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-slate-100 p-3 text-slate-700 shadow-sm">
          {file ? <FileUp className="h-6 w-6" /> : <UploadCloud className="h-6 w-6" />}
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-800">{label}</div>
          <div className="text-sm text-slate-500">{helperText}</div>
        </div>
      </div>
    </button>
  );
};
