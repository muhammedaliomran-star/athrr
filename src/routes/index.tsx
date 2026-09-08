import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";

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
      { property: "og:image", content: "/favicon.svg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/favicon.svg" },
    ],
    links: [{ rel: "canonical", href: "https://athrr.lovable.app/" }],
  }),
  component: LandingPage,
});

function LandingPage() {
  const bodyMarkup = useMemo(() => {
    const body = landingMarkup.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? landingMarkup;
    return body
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<svg /gi, '<svg aria-hidden="true" ')
      .replace('href="#cta"', 'href="/app"')
      .replace(/href="#"/g, 'href="/app"')
      .replace('class="features-section"', 'id="features" class="features-section"')
      .replace('class="how-it-works"', 'id="how-it-works" class="how-it-works"')
      .replace('class="privacy-section"', 'id="privacy" class="privacy-section"')
      .replace('class="cta-section"', 'id="cta" class="cta-section"');
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const sections = document.querySelectorAll(".landing-page-root section");
    if (!sections.length || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) observerEntry(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [bodyMarkup]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "أثر",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Windows",
    description: "تطبيق عربي لاستعادة الصور والفيديوهات المحذوفة محليًا.",
    url: "https://athrr.lovable.app/",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="landing-page-root" dangerouslySetInnerHTML={{ __html: bodyMarkup }} />
    </>
  );
}

function observerEntry(target: Element) {
  target.classList.add("animate-in");
}
