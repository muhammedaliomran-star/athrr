import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { Shell } from "@/components/recovery/Shell";
import { SourceScreen, type Target } from "@/components/recovery/SourceScreen";
import { ScanScreen } from "@/components/recovery/ScanScreen";
import { PreviewScreen } from "@/components/recovery/PreviewScreen";
import { RecoverScreen } from "@/components/recovery/RecoverScreen";
import {
  listDrives,
  startScan,
  type ScanMode,
  type ScanHandle,
  type RecoverResult,
  isDesktop,
} from "@/lib/athar-bridge";
import type { Drive, FoundFile } from "@/lib/recovery-data";
import {
  addHistory,
  clearSession,
  loadSession,
  loadSettings,
  saveSession,
  saveSettings,
} from "@/lib/persist";

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
  const [driveId, setDriveId] = useState("");
  const [target, setTarget] = useState<Target>("both");
  const [mode, setMode] = useState<ScanMode>("quick");
  const [files, setFiles] = useState<FoundFile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [destination, setDestination] = useState("");

  const [drives, setDrives] = useState<Drive[]>([]);
  const [drivesLoading, setDrivesLoading] = useState(true);
  const [drivesError, setDrivesError] = useState<string | null>(null);

  const [scanState, setScanState] = useState({
    percent: 0,
    images: 0,
    videos: 0,
    currentPath: "",
    phase: "quick" as "quick" | "deep",
  });
  const [scanPaused, setScanPaused] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scanRef = useRef<ScanHandle | null>(null);
  const restored = useRef(false);

  /* ---------- الثيم ---------- */
  useEffect(() => {
    const stored = localStorage.getItem("recovery-theme");
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(stored ? stored === "dark" : prefers);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggleTheme = () =>
    setDark((d) => {
      localStorage.setItem("recovery-theme", d ? "light" : "dark");
      return !d;
    });

  /* ---------- استرجاع الجلسة بعد تحديث الصفحة ---------- */
  useEffect(() => {
    const saved = loadSession();
    const settings = loadSettings();
    if (saved) {
      setDriveId(saved.driveId);
      setTarget(saved.target);
      setFiles(saved.files);
      setSelected(new Set(saved.selected));
      setDestination(saved.destination || settings.defaultDestination);
      // لا نستأنف شاشة الفحص: نرجع لأقرب خطوة آمنة
      setStep(saved.step === 1 ? 0 : saved.step);
    } else {
      setDestination(settings.defaultDestination);
    }
    setMode(settings.scanDepth);
    restored.current = true;
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    saveSession({
      step,
      driveId,
      target,
      files: step >= 2 ? files : [],
      selected: [...selected],
      destination,
    });
  }, [step, driveId, target, files, selected, destination]);

  /* ---------- قراءة الأقراص ---------- */
  const refreshDrives = useCallback(() => {
    setDrivesLoading(true);
    setDrivesError(null);
    listDrives()
      .then((found) => {
        setDrives(found);
        setDriveId((current) =>
          current && found.some((d) => d.id === current) ? current : (found[0]?.id ?? ""),
        );
      })
      .catch((e: unknown) =>
        setDrivesError(e instanceof Error ? e.message : "تعذّر قراءة الأقراص المتصلة."),
      )
      .finally(() => setDrivesLoading(false));
  }, []);

  useEffect(refreshDrives, [refreshDrives]);

  const drive = drives.find((d) => d.id === driveId);

  /* ---------- الفحص ---------- */
  const beginScan = useCallback(() => {
    if (!drive) return;
    setScanError(null);
    setScanPaused(false);
    setScanState({ percent: 0, images: 0, videos: 0, currentPath: "", phase: mode === "deep" ? "deep" : "quick" });
    setStep(1);
    scanRef.current = startScan({
      drive,
      target,
      mode,
      onProgress: (p) =>
        setScanState({
          percent: p.percent,
          images: p.images,
          videos: p.videos,
          currentPath: p.currentPath ?? "",
          phase: p.phase ?? (mode === "deep" ? "deep" : "quick"),
        }),
      onDone: (found) => {
        scanRef.current = null;
        setFiles(found);
        setSelected(new Set(found.filter((f) => f.health === "سليمة").slice(0, 3).map((f) => f.id)));
        setStep(2);
      },
      onError: (message) => {
        scanRef.current = null;
        setScanError(message);
      },
    });
  }, [drive, target, mode]);

  const stopScan = useCallback(() => {
    scanRef.current?.cancel();
    scanRef.current = null;
    setScanPaused(false);
    setStep(0);
  }, []);

  // منع الخروج أثناء الفحص
  useEffect(() => {
    if (step !== 1 || scanError) return undefined;
    const guard = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [step, scanError]);

  useEffect(() => () => scanRef.current?.cancel(), []);

  const toggleFile = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedFiles = files.filter((f) => selected.has(f.id));
  const totalMb = selectedFiles.reduce((s, f) => s + f.sizeMb, 0);

  const handleFinished = (result: RecoverResult) => {
    addHistory({
      id: `${Date.now()}`,
      at: new Date().toISOString(),
      driveName: drive?.name ?? "قرص غير معروف",
      count: result.recovered,
      totalMb,
      destination: result.destination,
      failed: result.failed.length,
    });
  };

  const restart = () => {
    setSelected(new Set());
    setFiles([]);
    clearSession();
    setStep(0);
  };

  return (
    <Shell step={step} dark={dark} onToggleTheme={toggleTheme}>
      {step === 0 && (
        <SourceScreen
          drives={drives}
          loading={drivesLoading}
          error={drivesError}
          onRetry={refreshDrives}
          driveId={driveId}
          target={target}
          onSelectDrive={setDriveId}
          onSelectTarget={setTarget}
          mode={mode}
          onSelectMode={(m) => {
            setMode(m);
            saveSettings({ ...loadSettings(), scanDepth: m });
          }}
          onStart={beginScan}
        />
      )}
      {step === 1 && (
        <ScanScreen
          driveName={drive?.name ?? ""}
          percent={scanState.percent}
          images={scanState.images}
          videos={scanState.videos}
          currentPath={scanState.currentPath}
          phase={scanState.phase}
          paused={scanPaused}
          error={scanError}
          onTogglePause={() => {
            setScanPaused((p) => {
              scanRef.current?.setPaused(!p);
              return !p;
            });
          }}
          onCancel={stopScan}
          onRetry={beginScan}
        />
      )}
      {step === 2 && (
        <PreviewScreen
          files={files}
          desktopAvailable={isDesktop()}
          selected={selected}
          onToggle={toggleFile}
          onClear={() => setSelected(new Set())}
          onSelectAll={() => setSelected(new Set(files.map((f) => f.id)))}
          onRescan={beginScan}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <RecoverScreen
          files={selectedFiles}
          sourceRoot={drive?.path}
          destination={destination}
          onDestinationChange={setDestination}
          onFinished={handleFinished}
          onRestart={restart}
        />
      )}
    </Shell>
  );
}
