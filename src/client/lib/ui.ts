export const buttonBase =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-full border px-3.5 py-2 text-sm font-bold leading-none transition disabled:cursor-not-allowed disabled:opacity-55";

export const buttonPrimary = `${buttonBase} border-[var(--cc-accent)] bg-[var(--cc-accent)] text-white hover:border-[var(--cc-accent-hover)] hover:bg-[var(--cc-accent-hover)]`;

export const buttonSecondary = `${buttonBase} border-[var(--cc-border-strong)] bg-[var(--cc-panel)] text-[var(--cc-text)] hover:border-[var(--cc-muted)] hover:bg-[var(--cc-subtle)]`;

export const buttonCompact = "min-h-8 px-2.5 py-1.5 text-xs";

export const panel =
  "rounded-md border border-[var(--cc-border)] bg-[var(--cc-panel)] p-4 shadow-none max-[640px]:p-3";

export const eyebrow =
  "mb-2 text-xs font-bold uppercase tracking-[0.02em] text-[var(--cc-muted)]";

export const muted = "text-[var(--cc-muted)]";

export const field =
  "w-full rounded-2xl border border-[var(--cc-border-strong)] bg-[var(--cc-panel)] px-3 py-2 font-semibold text-[var(--cc-text)] transition focus:border-[var(--cc-accent)] focus:outline-none focus:ring-[3px] focus:ring-[color:var(--cc-accent-ring)] disabled:cursor-not-allowed disabled:opacity-55";
