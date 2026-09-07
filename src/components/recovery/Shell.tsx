import { Moon, Sun, HardDriveDownload } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const steps = ["المصدر", "الفحص", "المعاينة", "الاسترجاع"];

export function Shell({
  step,
  dark,
  onToggleTheme,
  children,
}: {
  step: number;
  dark: boolean;
  onToggleTheme: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background px-4 py-8 md:px-8 md:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-1/4 h-[32rem] w-[32rem] rounded-full bg-primary/15 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-52 left-1/4 h-[28rem] w-[28rem] rounded-full bg-primary-glow/10 blur-[120px]"
      />

      <div className="relative mx-auto w-full max-w-5xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <HardDriveDownload className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg leading-tight">استعادة الملفات</h2>
              <p className="text-[13px] text-muted-foreground">صور وفيديوهات محذوفة</p>
            </div>
          </div>

          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onToggleTheme}
                  aria-label={dark ? "التبديل للوضع النهاري" : "التبديل للوضع الليلي"}
                  className="h-11 w-11 rounded-full bg-card/70 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95"
                >
                  {dark ? (
                    <Sun className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  ) : (
                    <Moon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{dark ? "الوضع النهاري" : "الوضع الليلي"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </header>

        <nav className="mb-8 flex items-center gap-2" aria-label="خطوات الاسترجاع">
          {steps.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div className="w-full">
                <Progress
                  value={i <= step ? 100 : 0}
                  className="h-1 bg-border"
                  aria-label={`الخطوة ${i + 1}: ${label}`}
                />
                <p
                  className={`mt-2 text-[11px] tracking-[0.14em] ${
                    i <= step ? "text-primary" : "text-muted-foreground"
                  }`}
                  aria-current={i === step ? "step" : undefined}
                >
                  {label}
                </p>
              </div>
            </div>
          ))}
        </nav>

        <div className="rounded-[2rem] border border-border bg-card/40 p-1.5 shadow-[var(--shadow-soft)] backdrop-blur-sm">
          <div className="rounded-[calc(2rem-0.375rem)] border border-border/60 bg-card p-6 md:p-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
