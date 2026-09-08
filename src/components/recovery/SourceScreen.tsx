import { AlertTriangle, ArrowLeft, HardDrive, MemoryStick, RefreshCw, Radar, Usb } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ScanMode } from "@/lib/athar-bridge";
import type { Drive, FileKind } from "@/lib/recovery-data";

const icons = { disk: HardDrive, usb: Usb, sd: MemoryStick } as const;

export type Target = FileKind | "both";

const targets: { id: Target; label: string }[] = [
  { id: "image", label: "صور فقط" },
  { id: "video", label: "فيديو فقط" },
  { id: "both", label: "الاثنان معاً" },
];

export function SourceScreen({
  drives,
  loading,
  error,
  onRetry,
  driveId,
  target,
  onSelectDrive,
  onSelectTarget,
  mode,
  onSelectMode,
  onStart,
}: {
  drives: Drive[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  driveId: string;
  target: Target;
  onSelectDrive: (id: string) => void;
  onSelectTarget: (t: Target) => void;
  mode: ScanMode;
  onSelectMode: (m: ScanMode) => void;
  onStart: () => void;
}) {
  const selected = drives.find((d) => d.id === driveId);

  return (
    <div>
      <Badge
        variant="secondary"
        className="rounded-full bg-primary/10 text-[10px] tracking-[0.2em] text-primary hover:bg-primary/10"
      >
        الخطوة الأولى
      </Badge>
      <h1 className="mt-4 text-3xl md:text-4xl">اختر القرص اللي عايز تفحصه</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        كل الأقراص والفلاشات المتصلة بجهازك ظاهرة تحت.
      </p>

      {error && (
        <Alert className="mt-6 border-transparent bg-destructive/10 text-destructive">
          <AlertTriangle className="h-4 w-4" strokeWidth={1.5} />
          <AlertTitle>تعذّر قراءة الأقراص</AlertTitle>
          <AlertDescription className="text-[13px] leading-relaxed">
            {error}
            <Button variant="outline" onClick={onRetry} className="mt-3 gap-2 rounded-full">
              <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
              إعادة المحاولة
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="mt-8 grid gap-3 sm:grid-cols-2" aria-live="polite">
          <span className="sr-only">جارٍ قراءة الأقراص المتصلة</span>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[132px] animate-pulse rounded-[1.5rem] border border-border bg-secondary/40" />
          ))}
        </div>
      )}

      {!loading && !error && drives.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-[15px] text-muted-foreground">لم نعثر على أي قرص متصل بجهازك.</p>
          <Button variant="outline" onClick={onRetry} className="mt-4 gap-2 rounded-full">
            <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
            تحديث القائمة
          </Button>
        </div>
      )}

      <RadioGroup
        value={driveId}
        onValueChange={onSelectDrive}
        aria-label="اختيار القرص"
        className="mt-8 grid gap-3 sm:grid-cols-2"
      >
        {drives.map((d) => {
          const Icon = icons[d.kind];
          const active = d.id === driveId;
          const pct = Math.round((d.usedGb / d.totalGb) * 100);
          return (
            <Label
              key={d.id}
              htmlFor={`drive-${d.id}`}
              className={`group cursor-pointer rounded-[1.5rem] border p-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.985] ${
                active
                  ? "border-primary/40 bg-primary/10"
                  : "border-border bg-secondary/40 hover:bg-secondary"
              }`}
            >
              <Card className="rounded-[calc(1.5rem-0.375rem)] border-border/60 bg-card p-5 shadow-none">
                <div className="mb-3 flex items-center gap-3">
                  <RadioGroupItem value={d.id} id={`drive-${d.id}`} />
                  <Icon
                    className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`}
                    strokeWidth={1.5}
                  />
                  <span className="font-medium">{d.name}</span>
                  {d.isSystem && (
                    <Badge className="border-transparent bg-warning/15 text-[11px] text-warning hover:bg-warning/20">
                      قرص النظام
                    </Badge>
                  )}
                </div>
                <p className="num mb-3 text-[13px] font-normal text-muted-foreground">
                  مساحة مستخدمة {d.usedGb} جيجا من {d.totalGb}
                </p>
                <Progress
                  value={pct}
                  aria-label={`المساحة المستخدمة في ${d.name}`}
                  className={`h-1.5 bg-border ${active ? "" : "[&>div]:bg-muted-foreground/50"}`}
                />
              </Card>
            </Label>
          );
        })}
      </RadioGroup>

      {selected?.isSystem && (
        <Alert className="mt-6 border-transparent bg-warning/10 text-warning">
          <AlertTriangle className="h-4 w-4" strokeWidth={1.5} />
          <AlertTitle>تنبيه بخصوص قرص النظام</AlertTitle>
          <AlertDescription className="text-[13px] leading-relaxed">
            الفحص والاسترجاع من نفس قرص النظام قد يقلل من فرص الاسترجاع، ننصح بالفحص فقط الآن وحفظ
            النتائج على قرص آخر.
          </AlertDescription>
        </Alert>
      )}

      <p className="mt-8 mb-3 text-[15px] text-muted-foreground" id="target-label">
        نوع الملفات المستهدفة
      </p>
      <ToggleGroup
        type="single"
        value={target}
        onValueChange={(v) => v && onSelectTarget(v as Target)}
        aria-labelledby="target-label"
        className="inline-flex gap-1 rounded-full border border-border bg-secondary/60 p-1"
      >
        {targets.map((t) => (
          <ToggleGroupItem
            key={t.id}
            value={t.id}
            className="rounded-full px-5 py-2 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {t.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <p className="mt-8 mb-3 text-[15px] text-muted-foreground" id="mode-label">
        عمق الفحص
      </p>
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(v) => v && onSelectMode(v as ScanMode)}
        aria-labelledby="mode-label"
        className="inline-flex gap-1 rounded-full border border-border bg-secondary/60 p-1"
      >
        <ToggleGroupItem
          value="quick"
          className="rounded-full px-5 py-2 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          فحص سريع
        </ToggleGroupItem>
        <ToggleGroupItem
          value="deep"
          className="gap-2 rounded-full px-5 py-2 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          <Radar className="h-4 w-4" strokeWidth={1.5} />
          استخراج عميق
        </ToggleGroupItem>
      </ToggleGroup>

      {mode === "deep" && (
        <Alert className="mt-4 border-transparent bg-primary/10 text-foreground">
          <Radar className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <AlertTitle>الاستخراج العميق</AlertTitle>
          <AlertDescription className="text-[13px] leading-relaxed text-muted-foreground">
            بيقرأ القرص قطاع بقطاع ويطلع الصور والفيديوهات اللي اتمسحت خالص من جدول الملفات، حتى لو
            اسمها ضاع. يدعم حاليًا JPG وPNG وGIF وBMP وMP4 وMOV وAVI وHEIC. بياخد وقت أطول بكتير،
            ومحتاج تشغيل أثر بصلاحيات المدير.
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-10">
        <Button
          onClick={onStart}
          disabled={loading || !selected}
          size="lg"
          className="group gap-3 rounded-full py-6 pr-6 pl-2.5 hover:bg-primary-glow"
        >
          <span className="text-base">بدء الفحص</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-x-1 group-hover:scale-105">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </span>
        </Button>
      </div>
    </div>
  );
}
