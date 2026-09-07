export type FileKind = "image" | "video";
export type Health = "سليمة" | "جزئية" | "تالفة";

export type Drive = {
  id: string;
  name: string;
  kind: "disk" | "usb" | "sd";
  totalGb: number;
  usedGb: number;
  isSystem: boolean;
  /** مسار القرص على الجهاز (نسخة سطح المكتب فقط) */
  path?: string;
  /** الجهاز الخام للاستخراج العميق مثل \\.\C: */
  device?: string;
};

export type FoundFile = {
  id: string;
  name: string;
  kind: FileKind;
  sizeMb: number;
  health: Health;
  hue: number;
  /** المسار الأصلي على القرص (نسخة سطح المكتب) */
  path?: string;
  /** رابط معاينة حقيقي للصورة أو الفيديو */
  thumbUrl?: string;
  /** الملف اتجاب بالاستخراج العميق من قطاعات القرص */
  carved?: boolean;
  /** موقع الملف على القرص بالبايت (الاستخراج العميق) */
  offset?: number;
};

export const demoDrives: Drive[] = [
  { id: "c", name: "القرص C:", kind: "disk", totalGb: 512, usedGb: 388, isSystem: true },
  { id: "d", name: "القرص D:", kind: "disk", totalGb: 500, usedGb: 210, isSystem: false },
  { id: "usb", name: "فلاشة USB", kind: "usb", totalGb: 32, usedGb: 8, isSystem: false },
  { id: "sd", name: "كارت ميموري SD", kind: "sd", totalGb: 64, usedGb: 41, isSystem: false },
];

/** @deprecated استخدم listDrives من athar-bridge */
export const drives = demoDrives;

const healths: Health[] = ["سليمة", "سليمة", "سليمة", "جزئية", "تالفة"];

export function generateFiles(count: number): FoundFile[] {
  return Array.from({ length: count }, (_, i) => {
    const kind: FileKind = i % 5 === 0 ? "video" : "image";
    return {
      id: `f${i}`,
      name: kind === "video" ? `VID_${2100 + i}.mp4` : `IMG_${2200 + i}.jpg`,
      kind,
      sizeMb: Number((kind === "video" ? 40 + (i % 7) * 12.5 : 1.4 + (i % 9) * 0.8).toFixed(1)),
      health: healths[i % healths.length]!,
      hue: (i * 37) % 360,
    };
  });
}
