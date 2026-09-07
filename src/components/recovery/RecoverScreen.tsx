import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Folder, FolderCheck, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  chooseFolder,
  defaultDestination,
  isDesktop,
  openFolder,
  recoverFiles,
  type RecoverResult,
} from "@/lib/athar-bridge";
import type { FoundFile } from "@/lib/recovery-data";

type Phase = "confirm" | "running" | "done" | "failed";

export function RecoverScreen({
  files,
  totalMb,
  destination,
  onDestinationChange,
  onFinished,
  onRestart,
}: {
  files: FoundFile[];
  totalMb: number;
  destination: string;
  onDestinationChange: (path: string) => void;
  onFinished: (result: RecoverResult) => void;
  onRestart: () => void;
}) {
  const count = files.length;
  const [phase, setPhase] = useState<Phase>("confirm");
  const [draftPath, setDraftPath] = useState(destination);
  const [pathOpen, setPathOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<RecoverResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (destination) return;
    void defaultDestination().then(onDestinationChange);
  }, [destination, onDestinationChange]);

  // منع إغلاق النافذة أثناء النسخ
  useEffect(() => {
    if (phase !== "running") return undefined;
    const guard = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [phase]);

  const start = async () => {
    setPhase("running");
    setProgress(0);
    try {
      const res = await recoverFiles(files, destination, (p) => setProgress(p.percent));
      setResult(res);
      onFinished(res);
      setPhase("done");
      if (res.failed.length) {
        toast.warning("انتهى الاسترجاع مع بعض الأخطاء", {
          description: `${res.recovered} ملف نجح · ${res.failed.length} ملف فشل`,
        });
      } else {
        toast.success("تمت الاستعادة بنجاح", {
          description: `${res.recovered} ملف تم حفظهم في ${res.destination}`,
        });
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "حدث خطأ غير متوقع أثناء الاسترجاع.");
      setPhase("failed");
      toast.error("فشل الاسترجاع");
    }
  };

  const savePath = () => {
    const value = draftPath.trim();
    if (!value) {
      toast.error("اكتب مسار حفظ صحيح");
      return;
    }
    onDestinationChange(value);
    setPathOpen(false);
    toast.success("تم تحديث مسار الحفظ", { description: value });
  };

  return (
    <div>
      <Badge
        variant="secondary"
        className="rounded-full bg-primary/10 text-[10px] tracking-[0.2em] text-primary hover:bg-primary/10"
      >
        الخطوة الرابعة
      </Badge>

      {phase === "confirm" && (
        <div className="mx-auto mt-6 max-w-md">
          <div className="mb-4 flex items-center gap-3">
            <FolderCheck className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <h1 className="text-2xl">اختر مكان الحفظ</h1>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/40 px-4 py-3">
            <span className="num truncate text-sm" dir="ltr">
              {destination || "…"}
            </span>
            <Folder className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
          </div>

          <Alert className="mt-4 border-transparent bg-warning/10 text-warning">
            <AlertTriangle className="h-4 w-4" strokeWidth={1.5} />
            <AlertTitle>لا تحفظ على نفس القرص</AlertTitle>
            <AlertDescription className="text-[13px] leading-relaxed">
              الحفظ على نفس القرص المفحوص قد يؤدي لفقدان البيانات نهائياً. اختر قرصاً مختلفاً كلما
              أمكن.
            </AlertDescription>
          </Alert>

          <p className="num mt-4 text-[13px] text-muted-foreground" aria-live="polite">
            سيتم استرجاع {count} ملف بحجم {totalMb.toFixed(1)} ميجا.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {isDesktop() ? (
              <Button
                variant="outline"
                className="flex-1 rounded-full py-6 text-sm"
                onClick={async () => {
                  const p = await chooseFolder();
                  if (p) onDestinationChange(p);
                }}
              >
                تصفح المجلدات
              </Button>
            ) : (
              <Dialog
                open={pathOpen}
                onOpenChange={(o) => {
                  setPathOpen(o);
                  if (o) setDraftPath(destination);
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 rounded-full py-6 text-sm">
                    تغيير المسار
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-right">مسار حفظ الملفات</DialogTitle>
                    <DialogDescription className="text-right">
                      اكتب المسار الكامل للمجلد اللي عايز تحفظ فيه الملفات المستعادة.
                    </DialogDescription>
                  </DialogHeader>
                  <div>
                    <Label htmlFor="save-path" className="mb-1.5 block text-[13px]">
                      المسار
                    </Label>
                    <Input
                      id="save-path"
                      value={draftPath}
                      onChange={(e) => setDraftPath(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && savePath()}
                      className="num"
                      placeholder="F:\\Recovered"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPathOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={savePath}>حفظ المسار</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            <Button
              onClick={start}
              disabled={!destination || count === 0}
              className="flex-1 rounded-full py-6 text-sm hover:bg-primary-glow"
            >
              استعادة الآن
            </Button>
          </div>
        </div>
      )}

      {phase === "running" && (
        <div className="mx-auto mt-8 max-w-md text-center">
          <h1 className="text-2xl">جاري استعادة الملفات...</h1>
          <p className="num mt-2 truncate text-[13px] text-muted-foreground">الحفظ في {destination}</p>
          <Progress
            value={progress}
            aria-label="تقدم الاسترجاع"
            aria-valuetext={`${Math.round(progress)} بالمئة`}
            className="mt-8 h-2.5 bg-border"
          />
          <p className="num mt-3 text-sm text-muted-foreground" aria-live="polite">
            {Math.round(progress)}%
          </p>
          <p className="mt-4 text-[12px] text-muted-foreground">
            من فضلك لا تغلق التطبيق ولا تفصل القرص أثناء النسخ.
          </p>
        </div>
      )}

      {phase === "failed" && (
        <div className="mx-auto mt-8 max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <AlertTriangle className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h1 className="mt-6 text-2xl">فشل الاسترجاع</h1>
          <p className="mt-3 text-[14px] text-muted-foreground">{errorMsg}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => setPhase("confirm")} className="rounded-full px-6 py-6 text-sm">
              حاول مرة أخرى
            </Button>
            <Button variant="outline" onClick={onRestart} className="rounded-full px-6 py-6 text-sm">
              فحص جديد
            </Button>
          </div>
        </div>
      )}

      {phase === "done" && result && (
        <div className="mx-auto mt-8 max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h1 className="mt-6 text-3xl">
            {result.failed.length ? "اكتمل الاسترجاع جزئياً" : "تمت الاستعادة بنجاح"}
          </h1>
          <p className="num mt-3 text-[15px] text-muted-foreground">
            تم استرجاع {result.recovered} ملف إلى {result.destination}
          </p>

          {result.failed.length > 0 && (
            <div className="mt-5 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-right">
              <p className="num mb-2 text-[13px] text-warning">
                {result.failed.length} ملف لم يتم نسخه:
              </p>
              <ul className="num max-h-40 space-y-1 overflow-auto text-[12px] text-muted-foreground">
                {result.failed.map((f) => (
                  <li key={f.name}>
                    {f.name} — {f.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              onClick={async () => {
                const ok = await openFolder(result.destination);
                if (!ok)
                  toast("فتح المجلد متاح في نسخة سطح المكتب", { description: result.destination });
              }}
              className="rounded-full px-6 py-6 text-sm hover:bg-primary-glow"
            >
              فتح مجلد الملفات
            </Button>
            <Button variant="outline" onClick={onRestart} className="gap-2 rounded-full px-6 py-6 text-sm">
              <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
              فحص جديد
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
