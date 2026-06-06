/* ================================================
   FILE: src/layout/SidebarHeader.tsx
   ================================================ */

export function SidebarHeader() {
  return (
    <div className="h-20 px-6 flex items-center justify-between shrink-0 select-none">
      <span className="logo-full font-serif text-base tracking-[0.25em] text-[var(--text-main)] font-bold">
        AXIOM
      </span>
      <span className="logo-full font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)] bg-neutral-100 border border-neutral-200/40 px-1.5 py-0.5 font-bold">
        PLANNER
      </span>
    </div>
  );
}
