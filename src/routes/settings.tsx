import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/recovery/PageShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { chooseFolder, defaultDestination, isDesktop } from "@/lib/athar-bridge";
import {
  clearCrashes,
  clearHistory,
  clearSession,
  loadCrashes,
  loadSettings,
  saveSettings,
  type Settings,
} from "@/lib/persist";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات — أثر" },
      {
        name: "description",
        content: "اضبط عمق الفحص ومسار الحفظ الافتراضي وتقارير الأعطال في تطبيق أثر للاستعادة.",
      },
      { property: "og:title", content: "الإعدادات — أثر" },
      { property: "og:description", content: "تحكم كامل في طريقة عمل الفحص والاسترجاع." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [crashes, setCrashes] = useState(0);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setCrashes(loadCrashes().length);
    if (!s.defaultDestination) {
      void defaultDestination().then((d) => setSettings((prev) => (prev ? { ...prev, defaultDestination: d } : prev)));
    }
  }, []);

  if (!settings) return <PageShell>جارٍ التحميل…</PageShell>;

  const update = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  return (
    <PageShell>
      <h1 className="text-3xl md:text-4xl">الإعدادات</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">كل الإعدادات محفوظة على جهازك.</p>

      <section className="mt-8">
        <p className="mb-3 text-[15px]" id="depth-label">
          عمق الفحص
        </p>
        <ToggleGroup
          type="single"
          value={settings.scanDepth}
          onValueChange={(v) => v && update({ scanDepth: v as Settings["scanDepth"] })}
          aria-labelledby="depth-label"
          className="inline-flex gap-1 rounded-full border border-border bg-secondary/60 p-1"
        >
          <ToggleGroupItem value="quick" className="rounded-full px-5 py-2 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            فحص سريع
          </ToggleGroupItem>
          <ToggleGroupItem value="deep" className="rounded-full px-5 py-2 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            فحص عميق
          </ToggleGroupItem>
        </ToggleGroup>
      </section>

      <section className="mt-8 max-w-lg">
        <Label htmlFor="dest" className="mb-1.5 block text-[15px]">
          مسار الحفظ الافتراضي
        </Label>
        <div className="flex gap-2">
          <Input
            id="dest"
            className="num"
            value={settings.defaultDestination}
            onChange={(e) => update({ defaultDestination: e.target.value })}
          />
          {isDesktop() && (
            <Button
              variant="outline"
              onClick={async () => {
                const p = await chooseFolder();
                if (p) update({ defaultDestination: p });
              }}
            >
              تصفح
            </Button>
          )}
        </div>
      </section>

      <section className="mt-8 space-y-3">
        {[
          { key: "skipCorrupt", label: "تجاهل الملفات التالفة أثناء الاسترجاع" },
          { key: "confirmBeforeRecover", label: "اسألني قبل بدء الاسترجاع" },
          { key: "keepFolderStructure", label: "حافظ على ترتيب المجلدات الأصلي" },
          { key: "crashReports", label: "سجّل تقارير الأعطال محلياً" },
        ].map((o) => (
          <div key={o.key} className="flex items-center gap-3">
            <Checkbox
              id={o.key}
              checked={settings[o.key as keyof Settings] as boolean}
              onCheckedChange={(v) => update({ [o.key]: v === true } as Partial<Settings>)}
            />
            <Label htmlFor={o.key} className="cursor-pointer text-[14px] font-normal">
              {o.label}
            </Label>
          </div>
        ))}
      </section>

      <section className="mt-10 flex flex-wrap gap-3 border-t border-border pt-6">
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => {
            clearSession();
            toast.success("تم مسح الجلسة الحالية");
          }}
        >
          مسح الجلسة المحفوظة
        </Button>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => {
            clearHistory();
            toast.success("تم مسح سجل الاسترجاع");
          }}
        >
          مسح سجل الاسترجاع
        </Button>
        <Button
          variant="outline"
          className="num rounded-full"
          onClick={() => {
            clearCrashes();
            setCrashes(0);
            toast.success("تم مسح تقارير الأعطال");
          }}
        >
          مسح تقارير الأعطال ({crashes})
        </Button>
      </section>
    </PageShell>
  );
}
