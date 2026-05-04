import { FileText, Link2, HardDrive, Cloud } from "lucide-react";
import { formatFileSize } from "@/lib/fileUtils";
import { cn } from "@/lib/utils";
import { getProvider, type IntegrationProviderId } from "@/lib/integrations";

type SourceMeta = {
  name: string;
  sizeBytes: number;
  size?: number;
  sourceKind?: "local" | "cloud";
  storageMode?: "import" | "link";
  sourceProviderId?: string;
  externalPath?: string;
};

type Props = { file: SourceMeta; onRemove?: () => void; className?: string };

function label(id?: string) {
  if (!id) return "Cloud";
  return getProvider(id as IntegrationProviderId)?.shortName ?? id.replace(/_/g, " ");
}

export function EvidenceAttachmentCard({ file, onRemove, className }: Props) {
  const isCloud = file.sourceKind === "cloud";
  const size = file.sizeBytes ?? file.size ?? 0;
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg border p-3",
        isCloud ? "border-primary/20 bg-primary/5" : "border-success/20 bg-success/10",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2">
        {isCloud ? (
          <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        ) : (
          <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-0.5">
              <FileText className="h-3 w-3" />
              {formatFileSize(size)}
            </span>
            {isCloud && file.sourceProviderId && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {label(file.sourceProviderId)}
                {file.storageMode === "link" && <Link2 className="h-2.5 w-2.5" aria-label="link" />}
              </span>
            )}
          </div>
        </div>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded p-1 text-xs text-muted-foreground hover:bg-muted hover:text-destructive"
        >
          Remove
        </button>
      )}
    </div>
  );
}
