import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IsoPage, SectionHeading } from "./_shared";
import { useIsoStore } from "@/frameworks/iso27001/hooks/useIsoStore";
import { useIsoAssessment } from "@/frameworks/iso27001/hooks/useIsoAssessment";

export default function IsoSettings() {
  const { state, update, reset } = useIsoStore();
  const { updateOrganisation } = useIsoAssessment();

  return (
    <IsoPage
      title="ISO 27001 workspace settings"
      description="Workspace-scoped preferences and data lifecycle. Clearing data affects only this framework’s local store."
    >
      <div className="grid gap-6 max-w-xl">
        <Card>
          <CardHeader>
            <SectionHeading title="Risk scoring" subtitle="Used for acceptance hints in the risk register." />
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Likelihood / impact scale (max)</Label>
              <Input
                type="number"
                min={3}
                max={5}
                value={state.settings.riskScaleMax}
                onChange={(e) =>
                  update((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, riskScaleMax: Number(e.target.value) || 5 },
                  }))
                }
              />
            </div>
            <div>
              <Label className="text-xs">Residual score acceptance threshold (≤)</Label>
              <Input
                type="number"
                min={1}
                max={25}
                value={state.settings.acceptanceThreshold}
                onChange={(e) =>
                  update((prev) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      acceptanceThreshold: Number(e.target.value) || 6,
                    },
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeading title="Organisation defaults" subtitle="Also editable from the Assessment organisation profile." />
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-xs">Organisation name</Label>
              <Input
                value={state.organisation.organisationName ?? ""}
                onChange={(e) => updateOrganisation({ organisationName: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Default ISMS scope</Label>
              <Input
                value={state.organisation.ismsScope ?? ""}
                onChange={(e) => updateOrganisation({ ismsScope: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader>
            <SectionHeading title="Danger zone" subtitle="Reset removes all ISO workspace answers, evidence, SoA, risks and audits on this browser." />
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("Reset entire ISO 27001 workspace state? This cannot be undone.")) reset();
              }}
            >
              Reset ISO workspace data
            </Button>
          </CardContent>
        </Card>
      </div>
    </IsoPage>
  );
}
