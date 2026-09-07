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
  const [draftPath, setDraftPath] = useState(path);
  const [pathOpen, setPathOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (phase !== "running") return undefined;
    const id = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + Math.random() * 6);
        if (next >= 100) {
          clearInterval(id);
          setTimeout(() => {
            setPhase("done");
            toast.success("تمت الاستعادة بنجاح", {
              description: `${count} ملف تم حفظهم في ${path}`,
            });
          }, 400);
        }
        return next;
      });
    }, 130);
    return () => clearInterval(id);
  }, [phase, count, path]);

  const savePath = () => {
    const value = draftPath.trim();
    if (!value) {
      toast.error("اكتب مسار حفظ صحيح");
      return;
    }
    setPath(value);
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

          <div className="flex items-center justify-between rounded-2xl border border-border bg-secondary/40 px-4 py-3">
            <span className="num text-sm">{path}</span>
            <Folder className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
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

          <div className="mt-6 flex gap-3">
            <Dialog
              open={pathOpen}
              onOpenChange={(o) => {
                setPathOpen(o);
                if (o) setDraftPath(path);
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

            <Button
              onClick={() => setPhase("running")}
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
          <p className="num mt-2 text-[13px] text-muted-foreground">الحفظ في {path}</p>
          <Progress
            value={progress}
            aria-label="تقدم الاسترجاع"
            aria-valuetext={`${Math.round(progress)} بالمئة`}
            className="mt-8 h-2.5 bg-border"
          />
          <p className="num mt-3 text-sm text-muted-foreground" aria-live="polite">
            {Math.round(progress)}%
          </p>
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
            <Button
              onClick={() =>
                toast("فتح مجلد الملفات", {
                  description: `المسار: ${path} — فتح المجلد يشتغل في نسخة سطح المكتب.`,
                })
              }
              className="rounded-full px-6 py-6 text-sm hover:bg-primary-glow"
            >
              فتح مجلد الملفات
            </Button>
            <Button
              variant="outline"
              onClick={onRestart}
              className="gap-2 rounded-full px-6 py-6 text-sm"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
              فحص جديد
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
