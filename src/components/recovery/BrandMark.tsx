import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground shadow-sm",
        className,
      )}
    >
      <svg viewBox="0 0 48 48" className="h-[72%] w-[72%]" fill="none">
        <path
          d="M18 12.5H31.5C33.7 12.5 35.5 14.3 35.5 16.5V31.5C35.5 33.7 33.7 35.5 31.5 35.5H17.5C15.3 35.5 13.5 33.7 13.5 31.5V23"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19 29L23 25L27 28L31 23"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="13" r="2.5" fill="currentColor" opacity="0.45" />
        <circle cx="17.5" cy="17.5" r="2" fill="currentColor" opacity="0.72" />
        <circle cx="22.5" cy="13" r="1.5" fill="currentColor" />
      </svg>
    </span>
  );
}