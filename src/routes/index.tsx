import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { Shell } from "@/components/recovery/Shell";
import { SourceScreen, type Target } from "@/components/recovery/SourceScreen";
import { ScanScreen } from "@/components/recovery/ScanScreen";
import { PreviewScreen } from "@/components/recovery/PreviewScreen";
import { RecoverScreen } from "@/components/recovery/RecoverScreen";
import { drives, generateFiles, type FoundFile } from "@/lib/recovery-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "أثر — استعادة الصور والفيديوهات المحذوفة" },
      {
        name: "description",
        content:
          "أثر تطبيق عربي لاستعادة الصور والفيديوهات المحذوفة من الأقراص والفلاشات مع معاينة قبل الاسترجاع.",
      },
      { property: "og:title", content: "أثر — استعادة الصور والفيديوهات المحذوفة" },
      {
        property: "og:description",
         content: "كل أثر يستحق الرجوع. استعد صورك وفيديوهاتك المحذوفة وعاينها قبل الاسترجاع.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [dark, setDark] = useState(false);
  const [step, setStep] = useState(0);
  const [driveId, setDriveId] = useState("d");
  const [target, setTarget] = useState<Target>("both");
  const [files, setFiles] = useState<FoundFile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem("recovery-theme");
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(stored ? stored === "dark" : prefers);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggleTheme = () => {
    setDark((d) => {
      localStorage.setItem("recovery-theme", d ? "light" : "dark");
      return !d;
    });
  };

  const drive = drives.find((d) => d.id === driveId) ?? drives[0];

  if (!drive) return null;

  const handleScanDone = useCallback(() => {
    const generated = generateFiles(30).filter((f) =>
      target === "both" ? true : f.kind === target,
    );
    setFiles(generated);
    setSelected(new Set(generated.slice(0, 3).map((f) => f.id)));
    setStep(2);
  }, [target]);

  const toggleFile = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const totalMb = files.filter((f) => selected.has(f.id)).reduce((s, f) => s + f.sizeMb, 0);

  return (
    <Shell step={step} dark={dark} onToggleTheme={toggleTheme}>
      {step === 0 && (
        <SourceScreen
          driveId={driveId}
          target={target}
          onSelectDrive={setDriveId}
          onSelectTarget={setTarget}
          onStart={() => setStep(1)}
        />
      )}
      {step === 1 && (
        <ScanScreen driveName={drive.name} onDone={handleScanDone} onCancel={() => setStep(0)} />
      )}
      {step === 2 && (
        <PreviewScreen
          files={files}
          selected={selected}
          onToggle={toggleFile}
          onClear={() => setSelected(new Set())}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <RecoverScreen
          count={selected.size}
          totalMb={totalMb}
          onRestart={() => {
            setSelected(new Set());
            setFiles([]);
            setStep(0);
          }}
        />
      )}
    </Shell>
  );
}
