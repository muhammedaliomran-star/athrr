import { AlertTriangle, ArrowLeft, HardDrive, MemoryStick, Usb } from "lucide-react";
import { drives, type FileKind } from "@/lib/recovery-data";

const icons = { disk: HardDrive, usb: Usb, sd: MemoryStick } as const;

export type Target = FileKind | "both";

const targets: { id: Target; label: string }[] = [
  { id: "image", label: "صور فقط" },
  { id: "video", label: "فيديو فقط" },
  { id: "both", label: "الاثنان معاً" },
];

export function SourceScreen({
  driveId,
  target,
  onSelectDrive,
  onSelectTarget,
  onStart,
}: {
  driveId: string;
  target: Target;
  onSelectDrive: (id: string) => void;
  onSelectTarget: (t: Target) => void;
  onStart: () => void;
}) {
  const selected = drives.find((d) => d.id === driveId);

  return (
    <div>
      <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-primary">
        الخطوة الأولى
      </span>
      <h1 className="mt-4 text-3xl md:text-4xl">اختر القرص اللي عايز تفحصه</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        كل الأقراص والفلاشات المتصلة بجهازك ظاهرة تحت.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {drives.map((d) => {
          const Icon = icons[d.kind];
          const active = d.id === driveId;
          const pct = Math.round((d.usedGb / d.totalGb) * 100);
          return (
            <button
              key={d.id}
              onClick={() => onSelectDrive(d.id)}
              className={`group rounded-[1.5rem] border p-1.5 text-right transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.985] ${
                active
                  ? "border-primary/40 bg-primary/10"
                  : "border-border bg-secondary/40 hover:bg-secondary"
              }`}
            >
              <div className="rounded-[calc(1.5rem-0.375rem)] border border-border/60 bg-card p-5">
                <div className="mb-3 flex items-center gap-3">
                  <Icon
                    className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`}
                    strokeWidth={1.5}
                  />
                  <span className="font-medium">{d.name}</span>
                  {d.isSystem && (
                    <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] text-warning">
                      قرص النظام
                    </span>
                  )}
                </div>
                <p className="num mb-3 text-[13px] text-muted-foreground">
                  مساحة مستخدمة {d.usedGb} جيجا من {d.totalGb}
                </p>
                <div className="h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      active ? "bg-primary" : "bg-muted-foreground/50"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selected?.isSystem && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-warning/10 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" strokeWidth={1.5} />
          <p className="text-[13px] leading-relaxed text-warning">
            الفحص والاسترجاع من نفس قرص النظام قد يقلل من فرص الاسترجاع، ننصح بالفحص فقط الآن وحفظ
            النتائج على قرص آخر.
          </p>
        </div>
      )}

      <p className="mt-8 mb-3 text-[15px] text-muted-foreground">نوع الملفات المستهدفة</p>
      <div className="inline-flex gap-1 rounded-full border border-border bg-secondary/60 p-1">
        {targets.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelectTarget(t.id)}
            className={`rounded-full px-5 py-2 text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              target === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-10">
        <button
          onClick={onStart}
          className="group inline-flex items-center gap-3 rounded-full bg-primary py-2.5 pr-6 pl-2.5 text-primary-foreground transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-primary-glow active:scale-[0.98]"
        >
          <span className="text-base">بدء الفحص</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-x-1 group-hover:scale-105">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </span>
        </button>
      </div>
    </div>
  );
}
