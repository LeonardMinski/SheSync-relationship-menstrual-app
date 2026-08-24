import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import type { CycleEntry } from "@/types";

export function CycleDetailsCards({
  selectedData,
}: {
  selectedData?: CycleEntry;
}) {
  return (
    <>
      {selectedData?.symptoms && selectedData.symptoms.length > 0 && (
        <SymptomsCard symptoms={selectedData.symptoms} />
      )}

      {selectedData?.notes && <NotesCard notes={selectedData.notes} />}
    </>
  );
}

function SymptomsCard({ symptoms }: { symptoms: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Symptoms</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {symptoms.map((symptom) => (
            <span
              key={symptom}
              className="rounded-full bg-bg-elevated px-3 py-1 text-sm font-semibold text-[color:var(--accent-peach)]"
            >
              {symptom}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function NotesCard({ notes }: { notes: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-foreground">{notes}</p>
      </CardContent>
    </Card>
  );
}
