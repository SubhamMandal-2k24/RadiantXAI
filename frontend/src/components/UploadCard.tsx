import { useCallback, useRef, useState } from "react";

const ACCEPTED_TYPES = ["image/png", "image/jpeg"];
const MAX_SIZE_BYTES = 15 * 1024 * 1024;

interface UploadCardProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function UploadCard({ onFileSelected, disabled }: UploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndEmit = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setValidationError("Unsupported file type. Upload a PNG or JPEG chest X-ray.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setValidationError("File is too large. Maximum size is 15MB.");
        return;
      }
      setValidationError(null);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!disabled) validateAndEmit(e.dataTransfer.files[0]);
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-md border px-8 py-16 text-center transition-colors ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        } ${
          isDragging
            ? "border-accent bg-panel-raised"
            : "border-border-strong bg-panel hover:border-border-strong hover:bg-panel-raised"
        }`}
        style={{ borderStyle: "dashed" }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-dim" aria-hidden="true">
          <path d="M12 16V4M12 4L7 9M12 4l5 5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <p className="text-sm text-text">
            Drop a chest X-ray here, or <span className="text-accent">browse</span>
          </p>
          <p className="mt-1 text-xs text-text-dim">PNG or JPEG, up to 15MB</p>
        </div>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg" className="hidden" disabled={disabled} onChange={(e) => validateAndEmit(e.target.files?.[0])} />
      </div>
      {validationError && (
        <p role="alert" className="mt-3 text-sm text-finding">
          {validationError}
        </p>
      )}
    </div>
  );
}
