import { useEffect, useState } from "react";
import { FileText, GalleryHorizontalEnd, Loader2, ServerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { getMockProviderFiles } from "@/lib/integrations/mockProviderFiles";
import { isIntegrationsApiConfigured } from "@/lib/integrations/integrationEnv";
import { getProvider } from "@/lib/integrations/providers";
import type { ExternalFileReference, IntegrationProviderId } from "@/lib/integrations/types";
import { formatFileSize } from "@/lib/fileUtils";
import { ProviderLogo } from "./ProviderLogo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Props = { providerId: IntegrationProviderId; onSelect: (ref: ExternalFileReference, mode: "import" | "link") => void; onCancel: () => void };

export function ConnectedProviderFileBrowser({ providerId, onSelect, onCancel }: Props) {
  const def = getProvider(providerId);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<ExternalFileReference[]>([]);
  const [mode, setMode] = useState<"import" | "link">("link");
  const apiConfigured = isIntegrationsApiConfigured();

  useEffect(() => {
    if (!apiConfigured) {
      setFiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = window.setTimeout(() => {
      setFiles(getMockProviderFiles(providerId));
      setLoading(false);
    }, 450);
    return () => clearTimeout(t);
  }, [providerId, apiConfigured]);

  return (
    <div className="space-y-4">
      {def && (
        <div className="flex items-center gap-3">
          <ProviderLogo providerId={providerId} def={def} size="md" />
          <div>
            <p className="text-sm font-semibold text-foreground">{def.name}</p>
            <p className="text-xs text-muted-foreground">Pick a file, then import or store a link.</p>
          </div>
        </div>
      )}
      {!apiConfigured && (
        <Alert className="border-amber-500/30 bg-amber-500/5 text-amber-950 dark:text-amber-100 [&>svg]:text-amber-700 dark:[&>svg]:text-amber-400">
          <ServerOff className="h-4 w-4" />
          <AlertTitle>Integrations service not configured</AlertTitle>
          <AlertDescription>
            Cloud file listing is disabled. Set <code className="rounded bg-background/80 px-1 py-0.5 text-xs">VITE_INTEGRATIONS_API_URL</code> to your
            backend, complete OAuth, then return here. Use local upload from the previous tab in the meantime.
          </AlertDescription>
        </Alert>
      )}
      {apiConfigured && (
        <Alert>
          <GalleryHorizontalEnd className="h-4 w-4" />
          <AlertTitle>Development preview</AlertTitle>
          <AlertDescription>
            File names and paths below are <span className="font-medium">sample data</span> for UI and workflow testing. Wire{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">GET /v1/integrations/{providerId}/…/files</code> (or the
            appropriate provider file API) to return real content.
          </AlertDescription>
        </Alert>
      )}
      {apiConfigured && (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">Import</span> copies into CertifyGRC when the server API is
            available. <span className="font-medium text-foreground">Link</span> stores a reference to the file in the
            provider.
          </p>
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as "import" | "link")} className="mt-3 flex flex-col gap-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="link" id="mode-link" />
              <Label htmlFor="mode-link" className="text-sm font-normal">
                Link to file (default)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="import" id="mode-import" />
              <Label htmlFor="mode-import" className="text-sm font-normal">
                Import copy (server-side step)
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}
      {apiConfigured &&
        (loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Loading sample list…</p>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 bg-muted/20 py-10 text-center">
            <p className="text-sm text-muted-foreground max-w-sm">
              No files returned for this preview. Add a file-list route on your integrations service, or use local upload.
            </p>
          </div>
        ) : (
          <ul className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border p-1">
            {files.map((f) => (
              <li key={f.externalFileId}>
                <button
                  type="button"
                  onClick={() => onSelect(f, mode)}
                  className={cn("flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted")}
                >
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">{f.name}</span>
                    <span className="block text-xs text-muted-foreground">{f.path}</span>
                    <span className="text-[11px] text-muted-foreground">{formatFileSize(f.sizeBytes)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ))}
      <div className="flex justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Back
        </Button>
      </div>
    </div>
  );
}
