import { createFileRoute, Link } from "@tanstack/react-router";

import { PageShell } from "@/components/recovery/PageShell";
import { Button } from "@/components/ui/button";
import { isDesktop } from "@/lib/athar-bridge";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "عن أثر — تطبيق استعادة الصور والفيديوهات" },
      {
        name: "description",
        content:
          "تعرّف على أثر: تطبيق عربي لاستعادة الصور والفيديوهات المحذوفة من الأقراص والفلاشات، يعمل محلياً على جهازك.",
      },
      { property: "og:title", content: "عن أثر — تطبيق استعادة الصور والفيديوهات" },
      {
        property: "og:description",
        content: "تطبيق عربي لاستعادة الصور والفيديوهات المحذوفة، كل المعالجة تتم على جهازك.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <PageShell>
      <h1 className="text-3xl md:text-4xl">عن أثر</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
        أثر تطبيق عربي بالكامل لاستعادة الصور والفيديوهات المفقودة من الأقراص الصلبة والفلاشات
        وكروت الذاكرة. الفكرة بسيطة: تختار المصدر، يفحص أثر، تعاين النتائج قبل ما تسترجعها، وتحفظها
        في المكان اللي يناسبك.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          { t: "يعمل محلياً", d: "كل الفحص والاسترجاع يتم على جهازك، ولا يُرفع أي ملف لأي خادم." },
          { t: "معاينة قبل الاسترجاع", d: "تشوف الصور والفيديوهات وتختار اللي يهمك فقط." },
          { t: "حماية بياناتك", d: "ننبهك قبل الحفظ على نفس القرص المفحوص لتفادي فقدان البيانات." },
          { t: "عربي واتجاه صحيح", d: "الواجهة كلها من اليمين لليسار، مع وضع ليلي ونهاري." },
        ].map((f) => (
          <div key={f.t} className="rounded-2xl border border-border bg-secondary/40 p-5">
            <p className="font-medium">{f.t}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </div>

      <p className="num mt-8 text-[13px] text-muted-foreground">
        النسخة الحالية: {isDesktop() ? "نسخة سطح المكتب" : "نسخة الويب التجريبية"} · ATHAR 1.0
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild className="rounded-full px-6 py-6 text-sm">
          <Link to="/">ابدأ فحص جديد</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full px-6 py-6 text-sm">
          <Link to="/privacy">سياسة الخصوصية</Link>
        </Button>
      </div>
    </PageShell>
  );
}
