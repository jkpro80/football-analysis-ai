import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export default function Panel({
  children,
  className = "",
}: PanelProps) {
  return (
    <section
      className={`rounded-[28px] border border-slate-800/80 bg-slate-900/70 shadow-xl backdrop-blur ${className}`}
    >
      {children}
    </section>
  );
}
