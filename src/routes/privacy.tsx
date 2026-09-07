import { createFileRoute, Link } from "@tanstack/react-router";

import { PageShell } from "@/components/recovery/PageShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية — أثر" },
      {
        name: "description",
        content:
          "سياسة خصوصية أثر: كل عمليات الفحص والاسترجاع تتم محلياً على جهازك، ولا نرفع ملفاتك أو نجمع بياناتك الشخصية.",
      },
      { property: "og:title", content: "سياسة الخصوصية — أثر" },
      {
        property: "og:description",
        content: "ملفاتك تبقى على جهازك. أثر لا يرفع أي صورة أو فيديو إلى الإنترنت.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Privacy,
});

const sections = [
  {
    t: "ملفاتك لا تغادر جهازك",
    d: "الفحص والمعاينة والنسخ كلها تتم داخل جهازك. أثر لا يرفع أي صورة أو فيديو إلى أي خادم.",
  },
  {
    t: "ما الذي نحفظه؟",
    d: "نحفظ محلياً فقط: إعداداتك، سجل عمليات الاسترجاع (اسم القرص وعدد الملفات ومسار الحفظ)، وحالة الجلسة الأخيرة حتى لا تفقد تقدمك. كل ذلك يُخزّن على جهازك ويمكنك مسحه من الإعدادات.",
  },
  {
    t: "تقارير الأعطال",
    d: "لو فعّلت تقارير الأعطال، نسجّل رسالة الخطأ محلياً لمساعدتك على الإبلاغ عن المشكلة. لا تحتوي على محتوى ملفاتك، ويمكنك إيقافها في أي وقت.",
  },
  {
    t: "الصلاحيات",
    d: "يطلب أثر صلاحية قراءة الأقراص المختارة وكتابة الملفات في مجلد الحفظ الذي تحدده أنت فقط.",
  },
  {
    t: "حقوقك",
    d: "يمكنك مسح السجل والإعدادات وتقارير الأعطال في أي لحظة من شاشة الإعدادات، وإلغاء تثبيت التطبيق يزيل كل بياناته.",
  },
];

function Privacy() {
  return (
    <PageShell>
      <h1 className="text-3xl md:text-4xl">سياسة الخصوصية</h1>
      <p className="mt-3 text-[15px] text-muted-foreground">
        باختصار: ملفاتك ملكك وحدك، ولا شيء يُرفع إلى الإنترنت.
      </p>

      <div className="mt-8 space-y-5">
        {sections.map((s) => (
          <section key={s.t}>
            <h2 className="text-xl">{s.t}</h2>
            <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
              {s.d}
            </p>
          </section>
        ))}
      </div>

      <Button asChild variant="outline" className="mt-9 rounded-full px-6 py-6 text-sm">
        <Link to="/">العودة للتطبيق</Link>
      </Button>
    </PageShell>
  );
}
