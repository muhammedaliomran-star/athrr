import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Image as ImageIcon, Search, Video } from "lucide-react";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { FoundFile } from "@/lib/recovery-data";

type Filter = "all" | "image" | "video" | "healthy";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "image", label: "صور" },
  { id: "video", label: "فيديو" },
  { id: "healthy", label: "سليمة فقط" },
];

const PAGE_SIZE = 10;

function healthBadgeClass(health: FoundFile["health"]) {
  if (health === "سليمة") return "border-transparent bg-success/15 text-success hover:bg-success/20";
  if (health === "جزئية") return "border-transparent bg-warning/15 text-warning hover:bg-warning/20";
  return "border-transparent bg-destructive/15 text-destructive hover:bg-destructive/20";
}

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
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<FoundFile | null>(null);

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

  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [filter, query]);

  const pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalMb = files
    .filter((f) => selected.has(f.id))
    .reduce((sum, f) => sum + f.sizeMb, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge
            variant="secondary"
            className="rounded-full bg-primary/10 text-[10px] tracking-[0.2em] text-primary hover:bg-primary/10"
          >
            الخطوة الثالثة
          </Badge>
          <h1 className="mt-4 text-3xl md:text-4xl">نتائج الفحص</h1>
        </div>
        <div className="w-full sm:w-64">
          <Label htmlFor="file-search" className="mb-1.5 block text-[13px] text-muted-foreground">
            بحث باسم الملف
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.5}
            />
            <Input
              id="file-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="مثال: IMG_2201"
              className="rounded-full bg-secondary/40 py-5 pr-10 pl-4"
            />
          </div>
        </div>
      </div>

      <ToggleGroup
        type="single"
        value={filter}
        onValueChange={(v) => v && setFilter(v as Filter)}
        aria-label="فلترة النتائج"
        className="mt-6 flex flex-wrap items-center justify-start gap-2"
      >
        {filters.map((f) => (
          <ToggleGroupItem
            key={f.id}
            value={f.id}
            className="rounded-full border border-border px-4 py-1.5 text-[13px] data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {f.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div
        className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary/10 px-4 py-3"
        aria-live="polite"
      >
        <span className="num text-[13px] text-primary">
          تم تحديد {selected.size} ملف بحجم إجمالي {totalMb.toFixed(1)} ميجا
        </span>
        <Button variant="link" onClick={onClear} className="h-auto p-0 text-[13px] text-primary">
          إلغاء تحديد الكل
        </Button>
      </div>

      <ScrollArea className="mt-6 max-h-[26rem] pl-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {pageItems.map((f) => {
            const isSel = selected.has(f.id);
            return (
              <div
                key={f.id}
                className={`overflow-hidden rounded-2xl border transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  isSel ? "border-primary bg-primary/5" : "border-border bg-secondary/30"
                }`}
              >
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setPreview(f)}
                    aria-label={`معاينة ${f.name}`}
                    className="flex h-24 w-full items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, hsl(${f.hue} 45% 55% / 0.35), hsl(${(f.hue + 60) % 360} 45% 45% / 0.2))`,
                    }}
                  >
                    {f.kind === "video" ? (
                      <Video className="h-6 w-6 text-foreground/60" strokeWidth={1.5} />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-foreground/60" strokeWidth={1.5} />
                    )}
                  </button>
                  <Checkbox
                    id={`sel-${f.id}`}
                    checked={isSel}
                    onCheckedChange={() => onToggle(f.id)}
                    aria-label={`تحديد ${f.name}`}
                    className="absolute top-2 right-2 h-5 w-5 border-border bg-card/90"
                  />
                </div>
                <Label
                  htmlFor={`sel-${f.id}`}
                  className="num block cursor-pointer truncate px-3 pt-2 text-[11px] font-normal"
                >
                  {f.name}
                </Label>
                <div className="flex items-center gap-1.5 px-3 pb-3 pt-1.5">
                  <Badge className={`${healthBadgeClass(f.health)} text-[10px]`}>{f.health}</Badge>
                  <span className="num text-[11px] text-muted-foreground">{f.sizeMb} م.ب</span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {visible.length === 0 && (
        <p className="mt-10 text-center text-[15px] text-muted-foreground">لا توجد ملفات مطابقة.</p>
      )}

      {pages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === page}
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(p);
                  }}
                  className="num"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
          </PaginationContent>
        </Pagination>
      )}

      <div className="mt-10">
        <Button
          disabled={selected.size === 0}
          onClick={onNext}
          size="lg"
          className="group gap-3 rounded-full py-6 pr-6 pl-2.5 hover:bg-primary-glow"
        >
          <span className="text-base">استعادة المحدد</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-x-1 group-hover:scale-105">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </span>
        </Button>
      </div>

      <Dialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="num text-right">{preview?.name}</DialogTitle>
            <DialogDescription className="num text-right">
              {preview?.kind === "video" ? "ملف فيديو" : "ملف صورة"} · {preview?.sizeMb} م.ب ·{" "}
              {preview?.health}
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <AspectRatio
              ratio={16 / 9}
              className="flex items-center justify-center overflow-hidden rounded-xl"
              style={{
                background: `linear-gradient(135deg, hsl(${preview.hue} 45% 55% / 0.35), hsl(${(preview.hue + 60) % 360} 45% 45% / 0.2))`,
              }}
            >
              {preview.kind === "video" ? (
                <Video className="h-10 w-10 text-foreground/50" strokeWidth={1.2} />
              ) : (
                <ImageIcon className="h-10 w-10 text-foreground/50" strokeWidth={1.2} />
              )}
            </AspectRatio>
          )}
          {preview && (
            <Button
              onClick={() => onToggle(preview.id)}
              variant={selected.has(preview.id) ? "outline" : "default"}
              className="rounded-full"
            >
              {selected.has(preview.id) ? "إلغاء التحديد" : "تحديد للاسترجاع"}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
