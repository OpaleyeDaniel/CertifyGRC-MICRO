import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useUserIntegrations } from "@/lib/integrations/useUserIntegrations";
import { logIntegrationEvent } from "@/lib/integrations/auditLog";
import type { ConnectionStatus, ExternalFileReference, IntegrationProviderId } from "@/lib/integrations/types";
import { LocalFileUploadPanel } from "./LocalFileUploadPanel";
import { ExternalProviderPickerPanel } from "./ExternalProviderPickerPanel";
import { ConnectedProviderFileBrowser } from "./ConnectedProviderFileBrowser";
import { isIntegrationsApiConfigured } from "@/lib/integrations/integrationEnv";
import { Laptop, Cloud } from "lucide-react";

export type EvidencePickerContext = {
  surface: string;
  frameworkId?: string;
  questionId?: string;
  controlRef?: string;
  nistId?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: EvidencePickerContext;
  onLocalFiles: (files: File[]) => void;
  onExternal: (ref: ExternalFileReference, mode: "import" | "link") => void;
  multipleLocal?: boolean;
  localAccept?: string;
  localUploadDisabled?: boolean;
  title?: string;
};

export function EvidenceSourcePickerModal({
  open,
  onOpenChange,
  context,
  onLocalFiles,
  onExternal,
  multipleLocal = true,
  localAccept,
  localUploadDisabled,
  title = "Add evidence",
}: Props) {
  const { currentUser } = useAuth();
  const actor = { id: currentUser?.id, label: currentUser?.fullName ?? currentUser?.email };
  const { connections, connect, getConnection } = useUserIntegrations(actor);
  const [tab, setTab] = useState<"local" | "cloud">("local");
  const [browserFor, setBrowserFor] = useState<IntegrationProviderId | null>(null);

  const connMap: Partial<Record<IntegrationProviderId, ConnectionStatus>> = {};
  if (connections && typeof connections === "object") {
    for (const c of Object.values(connections)) {
      if (c?.providerId) connMap[c.providerId] = c.status;
    }
  }

  const handleLocal = (files: File[]) => {
    if (files.length === 0) return;
    logIntegrationEvent("evidence_uploaded_local", {
      actorUserId: actor.id,
      actorLabel: actor.label,
      message: `${files.length} file(s) from device`,
      context: {
        surface: context.surface,
        frameworkId: context.frameworkId,
        questionId: context.questionId,
        names: files.map((f) => f.name).join(", "),
      },
    });
    onLocalFiles(files);
    onOpenChange(false);
  };

  const handleExternal = (ref: ExternalFileReference, mode: "import" | "link") => {
    logIntegrationEvent(mode === "link" ? "evidence_external_link_added" : "evidence_attached_from_provider", {
      providerId: ref.providerId,
      actorUserId: actor.id,
      actorLabel: actor.label,
      message: ref.name,
      context: { surface: context.surface, mode, externalFileId: ref.externalFileId },
    });
    onExternal(ref, mode);
    onOpenChange(false);
    setBrowserFor(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setBrowserFor(null);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[min(90vh,720px)] max-w-3xl overflow-y-auto p-0 gap-0">
        <div className="border-b border-border bg-muted/30 px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-tight">{title}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Local files upload from this browser. Cloud sources require a connected app from Settings and a deployed
              integrations service{" "}
              {isIntegrationsApiConfigured()
                ? "— your organization's API base URL is configured in this build."
                : "— set VITE_INTEGRATIONS_API_URL in the client build to enable sign-in to cloud providers."}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-6">
          {browserFor ? (
            <ConnectedProviderFileBrowser
              providerId={browserFor}
              onSelect={handleExternal}
              onCancel={() => setBrowserFor(null)}
            />
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as "local" | "cloud")} className="w-full">
              <TabsList className="mb-4 grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="local" className="gap-2">
                  <Laptop className="h-4 w-4" />
                  This device
                </TabsTrigger>
                <TabsTrigger value="cloud" className="gap-2">
                  <Cloud className="h-4 w-4" />
                  Cloud
                </TabsTrigger>
              </TabsList>
              <TabsContent value="local" className="mt-0 outline-none">
                <LocalFileUploadPanel
                  accept={localAccept}
                  multiple={multipleLocal}
                  disabled={localUploadDisabled}
                  onFiles={handleLocal}
                />
              </TabsContent>
              <TabsContent value="cloud" className="mt-0 outline-none">
                <ExternalProviderPickerPanel
                  connections={connMap}
                  onConnect={(id) => connect(id)}
                  onBrowse={(id) => {
                    const c = getConnection(id);
                    if (c?.status === "expired" || c?.status === "error") {
                      connect(id);
                      return;
                    }
                    if (c?.status !== "connected" || !isIntegrationsApiConfigured()) return;
                    setBrowserFor(id);
                  }}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
