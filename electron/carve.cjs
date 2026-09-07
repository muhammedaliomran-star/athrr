/**
 * محرّك الاستخراج العميق (Carving)
 * يقرأ القرص قطاعاً قطاعاً ويستخرج الصور والفيديوهات من البصمات الثنائية،
 * حتى لو اتمسح اسم الملف ومكانه من جدول الملفات.
 */
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const MB = 1024 * 1024;
const CHUNK = 8 * MB;

const SIGNATURES = [
  {
    ext: "jpg",
    kind: "image",
    head: Buffer.from([0xff, 0xd8, 0xff]),
    tail: Buffer.from([0xff, 0xd9]),
    max: 40 * MB,
  },
  {
    ext: "png",
    kind: "image",
    head: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    tail: Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]),
    max: 80 * MB,
  },
  {
    ext: "gif",
    kind: "image",
    head: Buffer.from("GIF89a", "ascii"),
    tail: Buffer.from([0x00, 0x3b]),
    max: 24 * MB,
  },
];

// MP4 / MOV / 3GP: البصمة "ftyp" على الإزاحة 4 من بداية الملف
const FTYP = Buffer.from("ftyp", "ascii");
const MOOV_BRANDS = ["isom", "iso2", "mp41", "mp42", "avc1", "qt  ", "3gp", "M4V", "mmp4", "MSNV", "dash"];

/** يقرأ 8 بايت على إزاحة مطلقة */
async function readAt(fd, offset, length) {
  const buf = Buffer.alloc(length);
  const { bytesRead } = await fd.read(buf, 0, length, offset);
  return bytesRead === length ? buf : null;
}

/** يمشي على صناديق MP4 لحساب الطول الحقيقي للفيديو */
async function mp4Length(fd, start, limit) {
  let pos = start;
  let guard = 0;
  while (pos < limit && guard < 4096) {
    const header = await readAt(fd, pos, 8);
    if (!header) break;
    let size = header.readUInt32BE(0);
    const type = header.toString("ascii", 4, 8);
    if (!/^[a-zA-Z0-9 ]{4}$/.test(type)) break;
    if (size === 1) {
      const ext = await readAt(fd, pos + 8, 8);
      if (!ext) break;
      size = Number(ext.readBigUInt64BE(0));
    }
    if (size < 8 || size > limit - pos) break;
    pos += size;
    guard += 1;
  }
  const len = pos - start;
  return len > 8 ? len : 0;
}

function indexOfFrom(buf, sig, from) {
  return buf.indexOf(sig, from);
}

/**
 * يستخرج الملفات من جهاز خام.
 * @returns {Promise<Array>} قائمة الملفات المستخرجة
 */
async function carve({
  device,
  outDir,
  target = "both",
  maxFiles = 1500,
  maxBytes = 6 * 1024 * MB,
  shouldStop = () => false,
  isPaused = () => false,
  onTick = () => {},
}) {
  await fsp.mkdir(outDir, { recursive: true });

  let fd;
  try {
    fd = await fsp.open(device, "r");
  } catch (err) {
    const e = new Error("carve-open-failed");
    e.cause = err;
    e.code = err.code;
    throw e;
  }

  let deviceSize = 0;
  try {
    const st = await fd.stat();
    deviceSize = st.size || 0;
  } catch {
    deviceSize = 0;
  }
  if (!deviceSize) {
    // ويندوز لا يعطي حجماً للأجهزة الخام — نعتمد على القراءة حتى النهاية
    deviceSize = 0;
  }

  const results = [];
  const buf = Buffer.alloc(CHUNK);
  let offset = 0;
  let carvedBytes = 0;
  let images = 0;
  let videos = 0;
  let index = 0;

  const wantsKind = (kind) => target === "both" || target === kind;

  const writeRange = async (start, length, ext, kind, partial) => {
    const name = `مستخرج-${String(index + 1).padStart(5, "0")}.${ext}`;
    const outPath = path.join(outDir, name);
    const out = fs.createWriteStream(outPath);
    let written = 0;
    const tmp = Buffer.alloc(Math.min(CHUNK, length));
    try {
      while (written < length) {
        const want = Math.min(tmp.length, length - written);
        const { bytesRead } = await fd.read(tmp, 0, want, start + written);
        if (!bytesRead) break;
        if (!out.write(Buffer.from(tmp.subarray(0, bytesRead)))) {
          await new Promise((r) => out.once("drain", r));
        }
        written += bytesRead;
      }
    } finally {
      await new Promise((r) => out.end(r));
    }
    if (written < 256) {
      await fsp.rm(outPath, { force: true });
      return null;
    }
    index += 1;
    carvedBytes += written;
    if (kind === "image") images += 1;
    else videos += 1;
    results.push({
      id: `carved-${index}`,
      name,
      kind,
      sizeMb: Number((written / MB).toFixed(1)),
      health: partial || written < length ? "جزئية" : "سليمة",
      hue: (index * 47) % 360,
      path: outPath,
      thumbUrl: `file://${outPath.split(path.sep).join("/")}`,
      carved: true,
      offset: start,
    });
    return outPath;
  };

  let reachedEnd = false;
  while (!reachedEnd && !shouldStop() && results.length < maxFiles && carvedBytes < maxBytes) {
    while (isPaused() && !shouldStop()) await new Promise((r) => setTimeout(r, 200));
    let bytesRead = 0;
    try {
      ({ bytesRead } = await fd.read(buf, 0, CHUNK, offset));
    } catch {
      bytesRead = 0;
    }
    if (!bytesRead) break;
    if (bytesRead < CHUNK) reachedEnd = true;
    const view = buf.subarray(0, bytesRead);

    let cursor = 0;
    while (cursor < bytesRead) {
      if (shouldStop() || results.length >= maxFiles) break;

      // أقرب بصمة داخل هذه القطعة
      let best = null;
      for (const sig of SIGNATURES) {
        if (!wantsKind(sig.kind)) continue;
        const at = indexOfFrom(view, sig.head, cursor);
        if (at !== -1 && (!best || at < best.at)) best = { at, sig };
      }
      let ftypAt = -1;
      if (wantsKind("video")) {
        let probe = indexOfFrom(view, FTYP, cursor);
        while (probe !== -1) {
          const brand = view.toString("ascii", probe + 4, probe + 8);
          if (probe >= 4 && MOOV_BRANDS.some((b) => brand.startsWith(b.trim().slice(0, 3)))) {
            ftypAt = probe - 4;
            break;
          }
          probe = indexOfFrom(view, FTYP, probe + 4);
        }
      }
      if (ftypAt !== -1 && (!best || ftypAt < best.at)) best = { at: ftypAt, sig: null, video: true };
      if (!best) break;

      const absStart = offset + best.at;

      if (best.video) {
        const len = await mp4Length(fd, absStart, absStart + 2048 * MB);
        if (len >= 64 * 1024) {
          await writeRange(absStart, len, "mp4", "video", false);
          cursor = best.at + Math.max(len, 8);
          if (cursor > bytesRead) {
            offset = absStart + len;
            cursor = bytesRead;
          }
          continue;
        }
        cursor = best.at + 8;
        continue;
      }

      const sig = best.sig;
      if (sig.fixed) {
        // BMP: الطول مكتوب في الرأس
        const header = await readAt(fd, absStart, 6);
        const size = header ? header.readUInt32LE(2) : 0;
        if (size > 1024 && size < sig.max) {
          await writeRange(absStart, size, sig.ext, sig.kind, false);
          cursor = best.at + Math.min(size, bytesRead - best.at);
          continue;
        }
        cursor = best.at + 2;
        continue;
      }

      // بحث عن نهاية الملف داخل القرص من بداية البصمة
      let end = -1;
      let searchAt = absStart + sig.head.length;
      const limit = absStart + sig.max;
      const win = Buffer.alloc(2 * MB);
      while (searchAt < limit && !shouldStop()) {
        const { bytesRead: got } = await fd.read(win, 0, win.length, searchAt);
        if (!got) break;
        const found = win.subarray(0, got).indexOf(sig.tail);
        if (found !== -1) {
          end = searchAt + found + sig.tail.length;
          break;
        }
        searchAt += got - sig.tail.length;
      }
      const partial = end === -1;
      const length = partial ? Math.min(2 * MB, sig.max) : end - absStart;
      if (length > 1024) await writeRange(absStart, length, sig.ext, sig.kind, partial);
      cursor = best.at + Math.max(sig.head.length, Math.min(length, bytesRead - best.at));
      if (cursor <= best.at) cursor = best.at + sig.head.length;
    }

    offset += Math.max(bytesRead - 64, 1);
    const percent = deviceSize
      ? Math.min(99, (offset / deviceSize) * 100)
      : Math.min(99, (results.length / maxFiles) * 100);
    onTick({ percent, images, videos, currentPath: `${(offset / (1024 * MB)).toFixed(1)} جيجا مقروءة` });
  }

  await fd.close();
  onTick({ percent: 100, images, videos });
  return results;
}

module.exports = { carve };
