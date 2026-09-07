import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Folder, FolderCheck, RotateCcw } from "lucide-react";

type Phase = "confirm" | "running" | "done";

export function RecoverScreen({
  count,
  totalMb,
  onRestart,
}: {
  count: number;
  totalMb: number;
  onRestart: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("confirm");
  const [path, setPath] = useState("E:\\الملفات_المستعادة");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (phase !== "running") return undefined;
    const id = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + Math.random() * 6);
        if (next >= 100) {
          clearInterval(id);
          setTimeout(() => setPhase("done"), 400);
        }
        return next;
      });
    }, 130);
    return () => clearInterval(id);
  }, [phase]);

  return (
    <div>
      <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-primary">
        الخطوة الرابعة
      </span>

      {phase === "confirm" && (
        <div className="mx-auto mt-6 max-w-md">
          <div className="mb-4 flex items-center gap-3">
            <FolderCheck className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <h1 className="text-2xl">اختر مكان الحفظ</h1>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border bg-secondary/40 px-4 py-3">
            <span className="num text-sm">{path}</span>
            <Folder className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-warning/10 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" strokeWidth={1.5} />
            <p className="text-[13px] leading-relaxed text-warning">
              الحفظ على نفس القرص المفحوص قد يؤدي لفقدان البيانات نهائياً. اختر قرصاً مختلفاً كلما
              أمكن.
            </p>
          </div>

          <p className="num mt-4 text-[13px] text-muted-foreground">
            سيتم استرجاع {count} ملف بحجم {totalMb.toFixed(1)} ميجا.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setPath((p) => (p.startsWith("E:") ? "F:\\Recovered" : "E:\\الملفات_المستعادة"))}
              className="flex-1 rounded-full border border-border py-3 text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-secondary active:scale-[0.98]"
            >
              تغيير المسار
            </button>
            <button
              onClick={() => setPhase("running")}
              className="flex-1 rounded-full bg-primary py-3 text-sm text-primary-foreground transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-primary-glow active:scale-[0.98]"
            >
              استعادة الآن
            </button>
          </div>
        </div>
      )}

      {phase === "running" && (
        <div className="mx-auto mt-8 max-w-md text-center">
          <h1 className="text-2xl">جاري استعادة الملفات...</h1>
          <p className="num mt-2 text-[13px] text-muted-foreground">الحفظ في {path}</p>
          <div className="mt-8 h-2.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="num mt-3 text-sm text-muted-foreground">{Math.round(progress)}%</p>
        </div>
      )}

      {phase === "done" && (
        <div className="mx-auto mt-8 max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h1 className="mt-6 text-3xl">تمت الاستعادة بنجاح</h1>
          <p className="num mt-3 text-[15px] text-muted-foreground">
            تم استرجاع {count} ملف بحجم {totalMb.toFixed(1)} ميجا إلى {path}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button className="rounded-full bg-primary px-6 py-3 text-sm text-primary-foreground transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-primary-glow active:scale-[0.98]">
              فتح مجلد الملفات
            </button>
            <button
              onClick={onRestart}
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-secondary active:scale-[0.98]"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
              فحص جديد
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
