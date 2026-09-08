import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FolderOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/recovery/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { openFolder } from "@/lib/athar-bridge";
import { clearHistory, loadHistory, type HistoryEntry } from "@/lib/persist";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "سجل الاسترجاع — أثر" },
      {
        name: "description",
        content: "راجع كل عمليات استرجاع الصور والفيديوهات السابقة في أثر مع مسار الحفظ وعدد الملفات.",
      },
      { property: "og:title", content: "سجل الاسترجاع — أثر" },
      { property: "og:description", content: "كل عمليات الاسترجاع السابقة في مكان واحد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [items, setItems] = useState<HistoryEntry[]>([]);

  useEffect(() => setItems(loadHistory()), []);

  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl">سجل الاسترجاع</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            كل عملية استرجاع قمت بها محفوظة هنا على جهازك.
          </p>
        </div>
        {items.length > 0 && (
          <Button
            variant="outline"
            className="gap-2 rounded-full"
            onClick={() => {
              clearHistory();
              setItems([]);
              toast.success("تم مسح السجل");
            }}
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            مسح السجل
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-[15px] text-muted-foreground">لسه مفيش أي عملية استرجاع.</p>
          <Button asChild className="mt-5 rounded-full px-6">
            <Link to="/app">ابدأ أول فحص</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {items.map((h) => (
            <li
              key={h.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/40 p-4"
            >
              <div>
                <p className="num text-sm">
                  {h.count} ملف · {h.totalMb.toFixed(1)} ميجا · {h.driveName}
                </p>
                <p className="num mt-1 text-[12px] text-muted-foreground">{h.destination}</p>
                <p className="num mt-1 text-[11px] text-muted-foreground">
                  {new Date(h.at).toLocaleString("ar-EG")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {h.failed > 0 && (
                  <Badge className="num border-transparent bg-warning/15 text-warning hover:bg-warning/20">
                    {h.failed} فشل
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-full"
                  onClick={async () => {
                    const ok = await openFolder(h.destination);
                    if (!ok) toast("فتح المجلد متاح في نسخة سطح المكتب", { description: h.destination });
                  }}
                >
                  <FolderOpen className="h-4 w-4" strokeWidth={1.5} />
                  فتح المجلد
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
