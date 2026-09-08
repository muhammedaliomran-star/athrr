import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import landingMarkup from "../../landing-page/index.html?raw";
import "../../landing-page/style.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "أثر — كل أثر يستحق الرجوع" },
      {
        name: "description",
        content:
          "أثر تطبيق عربي لاستعادة الصور والفيديوهات المحذوفة من الأقراص والفلاشات مع معاينة قبل الاسترجاع.",
      },
      { property: "og:title", content: "أثر — كل أثر يستحق الرجوع" },
      {
        property: "og:description",
        content: "استعد ملفاتك المفقودة محليًا وبخصوصية كاملة.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const bodyMarkup = useMemo(() => {
    const body = landingMarkup.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? landingMarkup;
    return body
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace('href="#cta"', 'href="/app"')
      .replace(/href="#"/g, 'href="/app"')
      .replace('class="features-section"', 'id="features" class="features-section"')
      .replace('class="how-it-works"', 'id="how-it-works" class="how-it-works"')
      .replace('class="privacy-section"', 'id="privacy" class="privacy-section"')
      .replace('class="cta-section"', 'id="cta" class="cta-section"');
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: bodyMarkup }} />;
}
