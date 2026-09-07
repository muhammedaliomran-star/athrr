import { AlertTriangle, Image as ImageIcon, Pause, Play, RefreshCw, Video, X } from "lucide-react";
import type { ReactNode } from "react";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ScanScreen({
  driveName,
  percent,
  images,
  videos,
  currentPath,
  phase = "quick",
  paused,
  error,
  onTogglePause,
  onCancel,
  onRetry,
}: {
  driveName: string;
  percent: number;
  images: number;
  videos: number;
  currentPath?: string;
  phase?: "quick" | "deep";
  paused: boolean;
  error: string | null;
  onTogglePause: () => void;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const pct = Math.round(percent);
  const remaining = Math.max(0, Math.round(((100 - percent) / 100) * 180));
  const r = 70;
  const c = 2 * Math.PI * r;

  if (error) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <AlertTriangle className="h-8 w-8" strokeWidth={1.5} />
        </div>
        <h1 className="mt-6 text-2xl">توقّف الفحص</h1>
        <Alert className="mt-4 border-transparent bg-destructive/10 text-right text-destructive">
          <AlertTitle>سبب المشكلة</AlertTitle>
          <AlertDescription className="text-[13px] leading-relaxed">{error}</AlertDescription>
        </Alert>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={onRetry} className="gap-2 rounded-full px-6 py-6 text-sm">
            <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
            إعادة الفحص
          </Button>
          <Button variant="outline" onClick={onCancel} className="rounded-full px-6 py-6 text-sm">
            اختيار قرص آخر
          </Button>
        </div>
      </div>
    );
  }

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
        {percent >= 100
          ? "اكتمل الفحص"
          : paused
            ? "الفحص متوقف مؤقتاً"
            : phase === "deep"
              ? "استخراج عميق من قطاعات القرص..."
              : "فحص سريع شغال..."}
      </h1>
      {phase === "deep" && percent < 100 && (
        <p className="mt-2 text-[13px] text-muted-foreground">
          بنقرأ القرص قطاع بقطاع — العملية دي بطيئة بطبيعتها، سيبها تكمّل.
        </p>
      )}

      <div
        className="relative mx-auto mt-8 h-[150px] w-[150px] sm:mt-10 sm:h-[180px] sm:w-[180px]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${pct} بالمئة من الفحص`}
        aria-label="تقدم الفحص العميق"
      >
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="90" cy="90" r={r} fill="none" strokeWidth="10" className="stroke-border" strokeLinecap="round" />
          <circle
            cx="90"
            cy="90"
            r={r}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className="stroke-primary transition-[stroke-dashoffset] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            strokeDasharray={c}
            strokeDashoffset={c - (percent / 100) * c}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-4xl font-medium">{pct}%</span>
          <span className="num mt-1 text-[13px] text-muted-foreground">
            متبقي ~ {Math.max(1, Math.ceil(remaining / 60))} دقيقة
          </span>
        </div>
      </div>

      {currentPath && (
        <p className="num mx-auto mt-4 max-w-md truncate text-[11px] text-muted-foreground" dir="ltr">
          {currentPath}
        </p>
      )}

      <div className="mx-auto mt-8 grid max-w-lg gap-3 sm:mt-10 sm:grid-cols-2" aria-live="polite">
        <Counter icon={<ImageIcon className="h-5 w-5" strokeWidth={1.5} />} value={images} label="صورة تم العثور عليها" />
        <Counter icon={<Video className="h-5 w-5" strokeWidth={1.5} />} value={videos} label="فيديو تم العثور عليه" />
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3 sm:mt-10">
        <Button
          variant="outline"
          onClick={onTogglePause}
          className="gap-2 rounded-full bg-secondary/50 px-5 py-5"
        >
          {paused ? <Play className="h-4 w-4" strokeWidth={1.5} /> : <Pause className="h-4 w-4" strokeWidth={1.5} />}
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

function Counter({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
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
