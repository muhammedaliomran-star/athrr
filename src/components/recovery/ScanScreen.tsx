import { useEffect, useState } from "react";
import { Image as ImageIcon, Pause, Play, Video, X } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ScanScreen({
  driveName,
  onDone,
  onCancel,
}: {
  driveName: string;
  onDone: (images: number, videos: number) => void;
  onCancel: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + Math.random() * 3.5);
        if (next >= 100) clearInterval(id);
        return next;
      });
    }, 140);
    return () => clearInterval(id);
  }, [paused]);

  const images = Math.round((progress / 100) * 142);
  const videos = Math.round((progress / 100) * 17);
  const remaining = Math.max(0, Math.round(((100 - progress) / 100) * 180));
  const pct = Math.round(progress);

  useEffect(() => {
    if (progress < 100) return undefined;
    const t = setTimeout(() => onDone(142, 17), 600);
    return () => clearTimeout(t);
  }, [progress, onDone]);

  const r = 70;
  const c = 2 * Math.PI * r;

  return (
    <div className="text-center">
      <Badge
        variant="secondary"
        className="rounded-full bg-primary/10 text-[10px] tracking-[0.2em] text-primary hover:bg-primary/10"
      >
        الخطوة الثانية
      </Badge>
      <p className="mt-4 text-[15px] text-muted-foreground">جاري فحص {driveName}</p>
      <h1 className="mt-1 text-3xl md:text-4xl">
        {progress >= 100 ? "اكتمل الفحص" : paused ? "الفحص متوقف مؤقتاً" : "فحص عميق شغال..."}
      </h1>

      <div
        className="relative mx-auto mt-10 h-[180px] w-[180px]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${pct} بالمئة من الفحص`}
        aria-label="تقدم الفحص العميق"
      >
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" aria-hidden>
          <circle
            cx="90"
            cy="90"
            r={r}
            fill="none"
            strokeWidth="10"
            className="stroke-border"
            strokeLinecap="round"
          />
          <circle
            cx="90"
            cy="90"
            r={r}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className="stroke-primary transition-[stroke-dashoffset] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            strokeDasharray={c}
            strokeDashoffset={c - (progress / 100) * c}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-4xl font-medium">{pct}%</span>
          <span className="num mt-1 text-[13px] text-muted-foreground">
            متبقي ~ {Math.max(1, Math.ceil(remaining / 60))} دقيقة
          </span>
        </div>
      </div>

      <div className="mx-auto mt-10 grid max-w-lg gap-3 sm:grid-cols-2" aria-live="polite">
        <Counter
          icon={<ImageIcon className="h-5 w-5" strokeWidth={1.5} />}
          value={images}
          label="صورة تم العثور عليها"
        />
        <Counter
          icon={<Video className="h-5 w-5" strokeWidth={1.5} />}
          value={videos}
          label="فيديو تم العثور عليه"
        />
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button
          variant="outline"
          onClick={() => setPaused((p) => !p)}
          className="gap-2 rounded-full bg-secondary/50 px-5 py-5"
        >
          {paused ? (
            <Play className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <Pause className="h-4 w-4" strokeWidth={1.5} />
          )}
          {paused ? "استئناف" : "إيقاف مؤقت"}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 rounded-full border-destructive/40 px-5 py-5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
              إلغاء الفحص
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تلغي الفحص؟</AlertDialogTitle>
              <AlertDialogDescription>
                لو ألغيت دلوقتي هيضيع تقدم الفحص كله ({pct}%) وهتبدأ من الأول تاني.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>رجوع للفحص</AlertDialogCancel>
              <AlertDialogAction
                onClick={onCancel}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                نعم، ألغِ الفحص
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function Counter({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-secondary/40 p-1.5">
      <Card className="rounded-[calc(1.5rem-0.375rem)] border-border/60 bg-card p-5 shadow-none">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <p className="num mt-3 text-3xl font-medium">{value}</p>
        <p className="mt-1 text-[13px] text-muted-foreground">{label}</p>
      </Card>
    </div>
  );
}
