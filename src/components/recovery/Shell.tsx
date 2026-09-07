import { Link } from "@tanstack/react-router";
import { History, Info, Moon, Settings, Sun } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const steps = ["المصدر", "الفحص", "المعاينة", "الاسترجاع"];

const links = [
  { to: "/history", label: "سجل الاسترجاع", icon: History },
  { to: "/settings", label: "الإعدادات", icon: Settings },
  { to: "/about", label: "عن التطبيق", icon: Info },
] as const;

export function Shell({
  step,
  dark,
  onToggleTheme,
  children,
}: {
  step?: number;
  dark: boolean;
  onToggleTheme: () => void;
  children: ReactNode;
}) {
  return (
    <div className="brand-canvas relative min-h-[100dvh] overflow-x-hidden bg-background px-3 py-5 sm:px-4 sm:py-6 md:px-8 md:py-10">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:right-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        تخطي إلى المحتوى
      </a>

      <div className="relative mx-auto w-full max-w-5xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-5 md:mb-8">
          <Link to="/" className="flex items-center rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <div>
              <h2 className="brand-word text-3xl leading-none sm:text-4xl" aria-label="أُثر">
                أُثر
              </h2>
              <p className="mt-1 text-[12px] text-muted-foreground">كل أثر يستحق الرجوع</p>
            </div>
          </Link>

          <TooltipProvider delayDuration={200}>
            <nav className="flex items-center gap-1.5" aria-label="روابط التطبيق">
              {links.map(({ to, label, icon: Icon }) => (
                <Tooltip key={to}>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground"
                    >
                      <Link to={to} aria-label={label}>
                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{label}</TooltipContent>
                </Tooltip>
              ))}

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
            </nav>
          </TooltipProvider>
        </header>

        {step !== undefined && (
          <nav className="mb-6 flex items-center gap-2 md:mb-7" aria-label="خطوات الاسترجاع">
            {steps.map((label, i) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div className="w-full">
                  <Progress
                    value={i <= step ? 100 : 0}
                    className="h-1 bg-border"
                    aria-label={`الخطوة ${i + 1}: ${label}`}
                  />
                  <p
                    className={`mt-2 text-[10px] sm:text-[11px] ${
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
        )}

        <main id="main" className="border border-border bg-card/70 shadow-[var(--shadow-soft)] backdrop-blur-sm">
          <div className="border-r-2 border-r-primary p-4 sm:p-6 md:p-10">{children}</div>
        </main>

        <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
          <span>أثر لاستعادة الصور والفيديوهات</span>
          <span className="flex items-center gap-3">
            <Link to="/privacy" className="hover:text-foreground">
              سياسة الخصوصية
            </Link>
            <span className="num">ATHAR / RECOVERY 01</span>
          </span>
        </footer>
      </div>
    </div>
  );
}
