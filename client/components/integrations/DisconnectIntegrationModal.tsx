import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { getProvider } from "@/lib/integrations/providers";
import type { IntegrationProviderId } from "@/lib/integrations/types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; providerId: IntegrationProviderId | null; onConfirm: () => void };

export function DisconnectIntegrationModal({ open, onOpenChange, providerId, onConfirm }: Props) {
  const p = providerId ? getProvider(providerId) : null;
  if (!p) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Provider unavailable</DialogTitle>
            <DialogDescription>Could not load this integration. Try closing and opening Settings again.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1.5 text-left">
              <DialogTitle>Disconnect {p.name}?</DialogTitle>
              <DialogDescription className="text-left leading-relaxed">
                CertifyGRC will no longer be able to browse or attach new files from {p.name}. Evidence already stored
                inside CertifyGRC is kept. Items that only point at an external file in {p.name} may become unreachable
                for reviewers.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Disconnect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
