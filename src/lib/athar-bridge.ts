import { demoDrives, generateFiles, type Drive, type FoundFile } from "@/lib/recovery-data";

export type ScanTarget = "image" | "video" | "both";

export type ScanMode = "quick" | "deep";

export type ScanProgress = {
  percent: number;
  images: number;
  videos: number;
  currentPath?: string;
  phase?: "quick" | "deep";
};

export type RecoverProgress = { percent: number; done: number; total: number };

export type RecoverResult = {
  recovered: number;
  destination: string;
  failed: { name: string; reason: string }[];
};

type AtharApi = {
  version: string;
  listDrives: () => Promise<Drive[]>;
  startScan: (opts: {
    path: string;
    target: ScanTarget;
    mode?: ScanMode;
    device?: string;
  }) => Promise<{ scanId: string }>;
  clearCarved?: () => Promise<boolean>;
  cancelScan: () => Promise<void>;
  pauseScan: (paused: boolean) => Promise<void>;
  onScanProgress: (cb: (p: ScanProgress) => void) => () => void;
  onScanDone: (cb: (files: FoundFile[]) => void) => () => void;
  onScanError: (cb: (message: string) => void) => () => void;
  chooseFolder: () => Promise<string | null>;
  recover: (opts: { files: FoundFile[]; destination: string }) => Promise<RecoverResult>;
  onRecoverProgress: (cb: (p: RecoverProgress) => void) => () => void;
  openFolder: (path: string) => Promise<boolean>;
  defaultDestination: () => Promise<string>;
};

declare global {
  interface Window {
    athar?: AtharApi;
  }
}

export function getBridge(): AtharApi | undefined {
  if (typeof window === "undefined") return undefined;
  return window.athar;
}

export function isDesktop() {
  return getBridge() !== undefined;
}

export async function listDrives(): Promise<Drive[]> {
  const api = getBridge();
  if (!api) return demoDrives;
  const found = await api.listDrives();
  if (!found.length) throw new Error("لم نتمكن من قراءة الأقراص المتصلة بجهازك.");
  return found;
}

export type ScanHandle = {
  cancel: () => void;
  setPaused: (paused: boolean) => void;
};

/**
 * يشغّل الفحص. على سطح المكتب يقرأ القرص فعلياً، وعلى الويب يعمل بنسخة عرض.
 */
export function startScan(
  opts: {
    drive: Drive;
    target: ScanTarget;
    mode?: ScanMode;
    onProgress: (p: ScanProgress) => void;
    onDone: (files: FoundFile[]) => void;
    onError: (message: string) => void;
  },
): ScanHandle {
  const api = getBridge();

  if (api && opts.drive.path) {
    const offP = api.onScanProgress(opts.onProgress);
    const offD = api.onScanDone((files) => {
      offP();
      offD();
      offE();
      opts.onDone(files);
    });
    const offE = api.onScanError((m) => {
      offP();
      offD();
      offE();
      opts.onError(m || "فشل الفحص، حاول مرة أخرى.");
    });

    api
      .startScan({
        path: opts.drive.path,
        target: opts.target,
        mode: opts.mode ?? "quick",
        ...(opts.drive.device ? { device: opts.drive.device } : {}),
      })
      .catch((e: unknown) => opts.onError(e instanceof Error ? e.message : "فشل بدء الفحص."));

    return {
      cancel: () => {
        offP();
        offD();
        offE();
        void api.cancelScan();
      },
      setPaused: (p) => void api.pauseScan(p),
    };
  }

  // نسخة العرض (الويب)
  let percent = 0;
  let paused = false;
  let stopped = false;
  const totalImages = 142;
  const totalVideos = 17;
  const id = setInterval(() => {
    if (paused || stopped) return;
    percent = Math.min(100, percent + Math.random() * 3.5);
    opts.onProgress({
      percent,
      images: Math.round((percent / 100) * totalImages),
      videos: Math.round((percent / 100) * totalVideos),
    });
    if (percent >= 100) {
      clearInterval(id);
      setTimeout(() => {
        if (stopped) return;
        const files = generateFiles(30).filter((f) =>
          opts.target === "both" ? true : f.kind === opts.target,
        );
        opts.onDone(files);
      }, 500);
    }
  }, 140);

  return {
    cancel: () => {
      stopped = true;
      clearInterval(id);
    },
    setPaused: (p) => {
      paused = p;
    },
  };
}

export async function clearCarved(): Promise<void> {
  await getBridge()?.clearCarved?.();
}

export async function chooseFolder(): Promise<string | null> {
  const api = getBridge();
  if (!api) return null;
  return api.chooseFolder();
}

export async function defaultDestination(): Promise<string> {
  const api = getBridge();
  if (!api) return "E:\\الملفات_المستعادة";
  return api.defaultDestination();
}

export async function openFolder(path: string): Promise<boolean> {
  const api = getBridge();
  if (!api) return false;
  return api.openFolder(path);
}

export function onRecoverProgress(cb: (p: RecoverProgress) => void): () => void {
  const api = getBridge();
  if (!api) return () => {};
  return api.onRecoverProgress(cb);
}

export async function recoverFiles(
  files: FoundFile[],
  destination: string,
  onProgress: (p: RecoverProgress) => void,
): Promise<RecoverResult> {
  const api = getBridge();
  if (api) {
    const off = onRecoverProgress(onProgress);
    try {
      return await api.recover({ files, destination });
    } finally {
      off();
    }
  }

  // نسخة العرض
  return new Promise((resolve) => {
    let percent = 0;
    const id = setInterval(() => {
      percent = Math.min(100, percent + Math.random() * 6);
      onProgress({
        percent,
        done: Math.round((percent / 100) * files.length),
        total: files.length,
      });
      if (percent >= 100) {
        clearInterval(id);
        setTimeout(
          () => resolve({ recovered: files.length, destination, failed: [] }),
          300,
        );
      }
    }, 130);
  });
}
