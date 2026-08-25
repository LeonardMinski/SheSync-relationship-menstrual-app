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
    <section className="ss-card p-6 sm:p-8">
      <h2 className="ss-display text-3xl font-bold text-[color:var(--design-ink)]">
        Symptoms
      </h2>
      <div className="mt-5">
        <div className="flex flex-wrap gap-3">
          {symptoms.map((symptom) => (
            <span
              key={symptom}
              className="rounded-full bg-[color:var(--design-footer)] px-4 py-2 text-sm font-bold text-[color:var(--design-brown)]"
            >
              {symptom}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function NotesCard({ notes }: { notes: string }) {
  return (
    <section className="ss-card p-6 sm:p-8">
      <h2 className="ss-display text-3xl font-bold text-[color:var(--design-ink)]">
        Private Note
      </h2>
      <p className="mt-5 text-lg leading-8 text-[color:var(--design-muted)]">
        {notes}
      </p>
    </section>
  );
}
