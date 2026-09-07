import { Moon, Sun } from "lucide-react";
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
    <div className="brand-canvas relative min-h-[100dvh] overflow-hidden bg-background px-4 py-6 md:px-8 md:py-10">
      <div className="relative mx-auto w-full max-w-5xl">
        <header className="mb-8 flex items-center justify-between gap-4 border-b border-border/70 pb-5">
          <div className="flex items-center">
            <div>
              <h2 className="brand-word text-4xl leading-none" aria-label="أُثر">
                أُثر
              </h2>
              <p className="mt-1 text-[12px] text-muted-foreground">كل أثر يستحق الرجوع</p>
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
                  className="h-10 w-10 rounded-lg bg-card/70 transition-all duration-300 active:scale-95"
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

        <nav className="mb-7 flex items-center gap-2" aria-label="خطوات الاسترجاع">
          {steps.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div className="w-full">
                <Progress
                  value={i <= step ? 100 : 0}
                  className="h-1 bg-border"
                  aria-label={`الخطوة ${i + 1}: ${label}`}
                />
                <p
                  className={`mt-2 text-[11px] ${
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

        <main className="border border-border bg-card/70 shadow-[var(--shadow-soft)] backdrop-blur-sm">
          <div className="border-r-2 border-r-primary p-6 md:p-10">
            {children}
          </div>
        </main>

        <footer className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>أثر لاستعادة الصور والفيديوهات</span>
          <span className="num">ATHAR / RECOVERY 01</span>
        </footer>
      </div>
    </div>
  );
}
