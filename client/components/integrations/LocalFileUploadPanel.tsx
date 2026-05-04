import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { accept?: string; multiple?: boolean; disabled?: boolean; onFiles: (files: File[]) => void; className?: string };

export function LocalFileUploadPanel({ accept = ".pdf,.doc,.docx,.png,.jpg,.jpeg", multiple = true, disabled, onFiles, className }: Props) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (list: FileList | null) => {
    if (!list?.length) return;
    onFiles(Array.from(list));
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (!disabled) pick(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors",
          drag && !disabled ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Upload className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-foreground">Drop files here or click to browse</p>
        <p className="text-xs text-muted-foreground">Processed in your browser until saved. PDF, Office, and images.</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => pick(e.target.files)}
        />
      </div>
    </div>
  );
}
