import { useMemo, useState } from "react";
import { ArrowLeft, Check, Image as ImageIcon, Search, Video } from "lucide-react";
import type { FoundFile } from "@/lib/recovery-data";

type Filter = "all" | "image" | "video" | "healthy";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "image", label: "صور" },
  { id: "video", label: "فيديو" },
  { id: "healthy", label: "سليمة فقط" },
];

export function PreviewScreen({
  files,
  selected,
  onToggle,
  onClear,
  onNext,
}: {
  files: FoundFile[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
  onNext: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () =>
      files.filter((f) => {
        if (filter === "image" && f.kind !== "image") return false;
        if (filter === "video" && f.kind !== "video") return false;
        if (filter === "healthy" && f.health !== "سليمة") return false;
        return f.name.toLowerCase().includes(query.trim().toLowerCase());
      }),
    [files, filter, query],
  );

  const totalMb = files
    .filter((f) => selected.has(f.id))
    .reduce((sum, f) => sum + f.sizeMb, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-primary">
            الخطوة الثالثة
          </span>
          <h1 className="mt-4 text-3xl md:text-4xl">نتائج الفحص</h1>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث باسم الملف"
            className="w-full rounded-full border border-border bg-secondary/40 py-2.5 pr-10 pl-4 text-sm outline-none transition-colors focus:border-primary/50"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-1.5 text-[13px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              filter === f.id
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary/10 px-4 py-3">
        <span className="num text-[13px] text-primary">
          تم تحديد {selected.size} ملف بحجم إجمالي {totalMb.toFixed(1)} ميجا
        </span>
        <button onClick={onClear} className="text-[13px] text-primary underline-offset-4 hover:underline">
          إلغاء تحديد الكل
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {visible.map((f) => {
          const isSel = selected.has(f.id);
          return (
            <button
              key={f.id}
              onClick={() => onToggle(f.id)}
              className={`overflow-hidden rounded-2xl border text-right transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
                isSel ? "border-primary bg-primary/5" : "border-border bg-secondary/30 hover:bg-secondary/60"
              }`}
            >
              <div
                className="relative flex h-24 items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, hsl(${f.hue} 45% 55% / 0.35), hsl(${(f.hue + 60) % 360} 45% 45% / 0.2))`,
                }}
              >
                {f.kind === "video" ? (
                  <Video className="h-6 w-6 text-foreground/60" strokeWidth={1.5} />
                ) : (
                  <ImageIcon className="h-6 w-6 text-foreground/60" strokeWidth={1.5} />
                )}
                <span
                  className={`absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-300 ${
                    isSel
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card/80"
                  }`}
                >
                  {isSel && <Check className="h-3 w-3" strokeWidth={2.5} />}
                </span>
              </div>
              <p className="num truncate px-3 pt-2 text-[11px]">{f.name}</p>
              <p
                className={`px-3 pb-3 text-[11px] ${
                  f.health === "سليمة"
                    ? "text-success"
                    : f.health === "جزئية"
                      ? "text-warning"
                      : "text-destructive"
                }`}
              >
                {f.health} · <span className="num">{f.sizeMb} م.ب</span>
              </p>
            </button>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className="mt-10 text-center text-[15px] text-muted-foreground">لا توجد ملفات مطابقة.</p>
      )}

      <div className="mt-10">
        <button
          disabled={selected.size === 0}
          onClick={onNext}
          className="group inline-flex items-center gap-3 rounded-full bg-primary py-2.5 pr-6 pl-2.5 text-primary-foreground transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-primary-glow active:scale-[0.98] disabled:opacity-40"
        >
          <span className="text-base">استعادة المحدد</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-x-1 group-hover:scale-105">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </span>
        </button>
      </div>
    </div>
  );
}
