import { useEffect, useState, type ReactNode } from "react";

import { Shell } from "@/components/recovery/Shell";

/** غلاف للصفحات الثانوية: نفس الهوية بدون شريط الخطوات */
export function PageShell({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("recovery-theme");
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(stored ? stored === "dark" : prefers);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <Shell
      dark={dark}
      onToggleTheme={() =>
        setDark((d) => {
          localStorage.setItem("recovery-theme", d ? "light" : "dark");
          return !d;
        })
      }
    >
      {children}
    </Shell>
  );
}
