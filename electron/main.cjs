const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme } = require("electron");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const { execFile } = require("child_process");
const { carve } = require("./carve.cjs");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".heic", ".tif", ".tiff", ".raw", ".cr2", ".nef", ".dng"]);
const VIDEO_EXT = new Set([".mp4", ".mov", ".avi", ".mkv", ".wmv", ".flv", ".webm", ".m4v", ".3gp", ".mts"]);

let win = null;
let scan = { cancelled: false, paused: false, running: false };

function createWindow() {
  win = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#0b0f16" : "#ffffff",
    title: "أثر",
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setMenuBarVisibility(false);
  return win;
}

const { spawn } = require("child_process");
let serverProc = null;

/** يشغّل خادم أثر المحلي المرفق مع التطبيق ويعيد عنوانه */
function startLocalServer() {
  const entries = [
    path.join(__dirname, "..", "dist", "server", "index.mjs"),
    path.join(__dirname, "..", ".output", "server", "index.mjs"),
  ];
  const entry = entries.find((candidate) => fs.existsSync(candidate));
  if (!entry) return Promise.resolve(process.env.ATHAR_URL || "http://localhost:8080");
  const port = 41730 + Math.floor(Math.random() * 200);
  serverProc = spawn(process.execPath, [entry], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", PORT: String(port), HOST: "127.0.0.1" },
    stdio: "ignore",
  });
  const url = `http://127.0.0.1:${port}`;
  return new Promise((resolve) => {
    const started = Date.now();
    const ping = () => {
      require("http")
        .get(url, () => resolve(url))
        .on("error", () => (Date.now() - started > 15000 ? resolve(url) : setTimeout(ping, 250)));
    };
    setTimeout(ping, 300);
  });
}

async function boot() {
  const url = await startLocalServer();
  const w = createWindow();
  w.loadURL(url);
  w.webContents.on("did-fail-load", () => setTimeout(() => w.loadURL(url), 500));
}

app.whenReady().then(boot);
app.on("quit", () => {
  if (serverProc) serverProc.kill();
  try {
    fs.rmSync(path.join(app.getPath("temp"), "athar-carved"), { recursive: true, force: true });
  } catch {
    /* تنظيف اختياري */
  }
});
app.on("window-all-closed", () => process.platform !== "darwin" && app.quit());
app.on("activate", () => BrowserWindow.getAllWindows().length === 0 && boot());

/* ---------- الأقراص ---------- */

function run(cmd, args) {
  return new Promise((resolve) => {
    execFile(cmd, args, { windowsHide: true }, (err, stdout) => resolve(err ? "" : stdout));
  });
}

async function listDrives() {
  const systemRoot = path.parse(process.execPath).root;

  if (process.platform === "win32") {
    const command =
      "Get-CimInstance Win32_LogicalDisk | Select-Object DeviceID,DriveType,FreeSpace,Size,VolumeName | ConvertTo-Json -Compress";
    const out = await run("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command]);
    let rows = [];
    try {
      const parsed = out ? JSON.parse(out) : [];
      rows = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
    const drives = [];
    for (const row of rows) {
      const id = String(row.DeviceID || "").trim();
      if (!id) continue;
      const size = Number(row.Size || 0);
      const free = Number(row.FreeSpace || 0);
      if (!size) continue;
      const type = Number(row.DriveType || 3);
      const label = String(row.VolumeName || "").trim();
      drives.push({
        id,
        name: label ? `${label} (${id})` : `القرص ${id}`,
        kind: type === 2 ? "usb" : "disk",
        totalGb: Math.round(size / 1024 ** 3),
        usedGb: Math.round((size - free) / 1024 ** 3),
        isSystem: id.toLowerCase() === systemRoot.slice(0, 2).toLowerCase(),
        path: `${id}\\`,
        device: `\\\\.\\${id}`,
      });
    }
    return drives;
  }

  const out = await run("df", ["-kP"]);
  const drives = [];
  for (const line of out.split("\n").slice(1)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 6) continue;
    const [fsName, sizeK, usedK] = parts;
    const mount = parts.slice(5).join(" ");
    if (!fsName.startsWith("/dev/")) continue;
    const totalGb = Math.round(Number(sizeK) / 1024 / 1024);
    if (!totalGb) continue;
    const removable = mount.startsWith("/media") || mount.startsWith("/Volumes") || mount.startsWith("/run/media");
    drives.push({
      id: mount,
      name: mount === "/" ? "القرص الرئيسي" : path.basename(mount) || mount,
      kind: removable ? "usb" : "disk",
      totalGb,
      usedGb: Math.round(Number(usedK) / 1024 / 1024),
      isSystem: mount === "/",
      path: mount,
      device: fsName,
    });
  }
  return drives;
}

ipcMain.handle("athar:listDrives", () => listDrives());

/* ---------- الفحص ---------- */

const SKIP_DIRS = new Set(["node_modules", "System Volume Information", "Windows", "proc", "sys", "dev", "Library"]);
const RECOVERY_HINTS = ["$recycle.bin", ".trash", "trash", "recycler", ".thumbnails", "lost+found", "dcim", "camera"];

function classify(ext) {
  if (IMAGE_EXT.has(ext)) return "image";
  if (VIDEO_EXT.has(ext)) return "video";
  return null;
}

async function health(filePath, size) {
  // فحص مبدئي: ملف صفري أو رأس مقطوع = تالف/جزئي
  if (size === 0) return "تالفة";
  try {
    const fh = await fsp.open(filePath, "r");
    const buf = Buffer.alloc(Math.min(16, size));
    await fh.read(buf, 0, buf.length, 0);
    await fh.close();
    if (buf.every((b) => b === 0)) return "تالفة";
    if (size < 1024) return "جزئية";
    return "سليمة";
  } catch {
    return "جزئية";
  }
}

async function walk(root, target, onTick) {
  const results = [];
  const queue = [root];
  let visited = 0;
  let images = 0;
  let videos = 0;

  while (queue.length) {
    if (scan.cancelled) break;
    while (scan.paused && !scan.cancelled) await new Promise((r) => setTimeout(r, 200));
    const dir = queue.shift();
    let entries = [];
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch {
      continue; // صلاحيات مرفوضة — نتخطى
    }
    for (const entry of entries) {
      if (scan.cancelled) break;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        if (entry.name.startsWith(".") && !RECOVERY_HINTS.includes(entry.name.toLowerCase())) continue;
        queue.push(full);
        continue;
      }
      if (!entry.isFile()) continue;
      const kind = classify(path.extname(entry.name).toLowerCase());
      if (!kind) continue;
      if (target !== "both" && kind !== target) continue;
      let stat;
      try {
        stat = await fsp.stat(full);
      } catch {
        continue;
      }
      const h = await health(full, stat.size);
      if (kind === "image") images += 1;
      else videos += 1;
      results.push({
        id: `${results.length}-${stat.ino || stat.size}`,
        name: entry.name,
        kind,
        sizeMb: Number((stat.size / 1024 / 1024).toFixed(1)),
        health: h,
        hue: (results.length * 37) % 360,
        path: full,
        thumbUrl: `file://${full.split(path.sep).join("/")}`,
      });
      if (results.length >= 5000) {
        queue.length = 0;
        break;
      }
    }
    visited += 1;
    if (visited % 10 === 0) {
      const percent = Math.min(97, (visited / (visited + queue.length)) * 100);
      onTick({ percent, images, videos, currentPath: dir });
    }
  }

  onTick({ percent: 100, images, videos });
  return results;
}

function carveDir() {
  return path.join(app.getPath("temp"), "athar-carved");
}

ipcMain.handle("athar:startScan", async (_e, { path: root, target, mode, device }) => {
  if (scan.running) throw new Error("هناك فحص شغال بالفعل.");
  scan = { cancelled: false, paused: false, running: true };
  const send = (channel, payload) => win && !win.isDestroyed() && win.webContents.send(channel, payload);
  const deep = mode === "deep";
  (async () => {
    try {
      await fsp.access(root, fs.constants.R_OK);
      let files = await walk(root, target, (p) =>
        send("athar:scanProgress", deep ? { ...p, percent: p.percent * 0.35, phase: "quick" } : p),
      );
      if (scan.cancelled) return;

      if (deep && device) {
        await fsp.rm(carveDir(), { recursive: true, force: true });
        const baseImages = files.filter((f) => f.kind === "image").length;
        const baseVideos = files.filter((f) => f.kind === "video").length;
        try {
          const carved = await carve({
            device,
            outDir: carveDir(),
            target,
            shouldStop: () => scan.cancelled,
            isPaused: () => scan.paused,
            onTick: (p) =>
              send("athar:scanProgress", {
                percent: 35 + p.percent * 0.65,
                images: baseImages + (p.images || 0),
                videos: baseVideos + (p.videos || 0),
                currentPath: p.currentPath,
                phase: "deep",
              }),
          });
          files = files.concat(carved);
        } catch (err) {
          const code = err && (err.code || (err.cause && err.cause.code));
          if (code === "EACCES" || code === "EPERM") {
            send(
              "athar:scanError",
              "الاستخراج العميق محتاج صلاحيات المدير للوصول للقرص مباشرة. اقفل أثر وافتحه بخيار «تشغيل كمسؤول» ثم أعد الفحص.",
            );
            return;
          }
          if (code === "EBUSY") {
            send("athar:scanError", "القرص مشغول بواسطة النظام. اقفل البرامج اللي بتستخدمه وحاول تاني.");
            return;
          }
          send("athar:scanError", `تعذّر الاستخراج العميق: ${(err && err.message) || "خطأ غير معروف"}`);
          return;
        }
      }

      if (scan.cancelled) return;
      send("athar:scanDone", files);
    } catch (err) {
      send(
        "athar:scanError",
        err && err.code === "EACCES"
          ? "لا توجد صلاحية لقراءة هذا القرص. شغّل أثر بصلاحيات المدير وحاول مرة أخرى."
          : `تعذّر فحص القرص: ${(err && err.message) || "خطأ غير معروف"}`,
      );
    } finally {
      scan.running = false;
      if (scan.cancelled) void fsp.rm(carveDir(), { recursive: true, force: true });
    }
  })();
  return { scanId: String(Date.now()) };
});

ipcMain.handle("athar:clearCarved", async () => {
  await fsp.rm(carveDir(), { recursive: true, force: true });
  return true;
});

ipcMain.handle("athar:cancelScan", () => {
  scan.cancelled = true;
  scan.paused = false;
});
ipcMain.handle("athar:pauseScan", (_e, paused) => {
  scan.paused = !!paused;
});

/* ---------- مسار الحفظ والاسترجاع ---------- */

ipcMain.handle("athar:defaultDestination", () =>
  path.join(app.getPath("documents"), "Athar-Recovered"),
);

ipcMain.handle("athar:chooseFolder", async () => {
  const res = await dialog.showOpenDialog(win, {
    title: "اختر مجلد الحفظ",
    properties: ["openDirectory", "createDirectory"],
  });
  return res.canceled ? null : res.filePaths[0];
});

ipcMain.handle("athar:openFolder", async (_e, target) => {
  const err = await shell.openPath(target);
  return !err;
});

function reason(err) {
  switch (err && err.code) {
    case "ENOSPC":
      return "المساحة غير كافية على قرص الحفظ";
    case "EACCES":
    case "EPERM":
      return "لا توجد صلاحية للكتابة في هذا المجلد";
    case "EEXIST":
      return "يوجد ملف بنفس الاسم";
    case "ENOENT":
      return "الملف الأصلي لم يعد موجوداً";
    case "EBUSY":
      return "الملف مستخدم بواسطة برنامج آخر";
    default:
      return (err && err.message) || "خطأ غير معروف";
  }
}

async function uniqueTarget(dir, name) {
  const ext = path.extname(name);
  const base = path.basename(name, ext);
  let candidate = path.join(dir, name);
  let i = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(dir, `${base} (${i})${ext}`);
    i += 1;
  }
  return candidate;
}

function isInside(parent, target) {
  const relative = path.relative(path.resolve(parent), path.resolve(target));
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function sameVolume(a, b) {
  if (process.platform !== "win32") return false;
  return path.parse(path.resolve(a)).root.toLowerCase() === path.parse(path.resolve(b)).root.toLowerCase();
}

ipcMain.handle(
  "athar:recover",
  async (_e, { files, destination, sourceRoot, keepFolderStructure }) => {
  const failed = [];
  let recovered = 0;
  if (sourceRoot && (sameVolume(sourceRoot, destination) || isInside(sourceRoot, destination))) {
    throw new Error("لا يمكن حفظ الملفات على نفس القرص المفحوص. اختر قرصًا مختلفًا لتقليل خطر فقدان البيانات.");
  }
  try {
    await fsp.mkdir(destination, { recursive: true });
  } catch (err) {
    return { recovered: 0, destination, failed: [{ name: destination, reason: reason(err) }] };
  }

  for (let i = 0; i < files.length; i += 1) {
    const f = files[i];
    try {
      if (!f.path) throw Object.assign(new Error("no path"), { code: "ENOENT" });
      const allowed = (sourceRoot && isInside(sourceRoot, f.path)) || isInside(carveDir(), f.path);
      if (!allowed) throw Object.assign(new Error("invalid source path"), { code: "EACCES" });
      let targetDir = destination;
      if (keepFolderStructure && sourceRoot && isInside(sourceRoot, f.path)) {
        const relativeDir = path.dirname(path.relative(sourceRoot, f.path));
        if (relativeDir && relativeDir !== ".") targetDir = path.join(destination, relativeDir);
        await fsp.mkdir(targetDir, { recursive: true });
      }
      const target = await uniqueTarget(targetDir, f.name);
      await fsp.copyFile(f.path, target);
      recovered += 1;
    } catch (err) {
      failed.push({ name: f.name, reason: reason(err) });
    }
    if (win && !win.isDestroyed()) {
      win.webContents.send("athar:recoverProgress", {
        percent: ((i + 1) / files.length) * 100,
        done: i + 1,
        total: files.length,
      });
    }
  }
  await fsp.rm(carveDir(), { recursive: true, force: true });
  return { recovered, destination, failed };
  },
);

ipcMain.handle("athar:version", () => `${app.getVersion()} · ${os.platform()}`);
