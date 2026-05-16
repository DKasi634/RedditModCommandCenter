import { requestExpandedMode } from "@devvit/web/client";
import {
  ArrowRight01Icon,
  ClipboardIcon,
  Shield01Icon,
  SparklesIcon,
  TransactionHistoryIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../styles.css";

export function Splash() {
  return (
    <main className="relative flex min-h-full overflow-hidden bg-[#0b1117] text-white selection:bg-orange-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(255,69,0,0.24),transparent_34%),linear-gradient(135deg,#111c24_0%,#071014_56%,#05090c_100%)]" />
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-orange-500/15 blur-[90px]" />
      <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-sky-500/10 blur-[110px]" />

      <div className="relative mx-auto grid w-full max-w-5xl items-center gap-8 px-7 py-10 md:grid-cols-[1fr_1.05fr] md:px-10">
        <section className="flex flex-col items-start gap-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
            <HugeiconsIcon icon={Shield01Icon} size={16} strokeWidth={1.8} />
            Moderator workspace
          </div>

          <div className="space-y-3">
            <h1 className="max-w-xl text-4xl font-black leading-[1.02] tracking-normal text-white md:text-5xl">
              Mod Queue Command Center
            </h1>
            <p className="max-w-lg text-base leading-7 text-slate-300 md:text-lg">
              Prioritize queue items, review context, request second opinions, and keep a clean decision trail.
            </p>
          </div>

          <div className="grid w-full max-w-lg grid-cols-3 gap-2.5 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
              <div className="text-2xl font-black">01</div>
              <div className="mt-1 text-slate-300">Triage first</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
              <div className="text-2xl font-black">02</div>
              <div className="mt-1 text-slate-300">Review context</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
              <div className="text-2xl font-black">03</div>
              <div className="mt-1 text-slate-300">Record action</div>
            </div>
          </div>

          <button
            className="group mt-2 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#ff4500] px-7 text-base font-black text-white shadow-[0_16px_40px_rgba(255,69,0,0.28)] transition hover:bg-[#ff5d22] active:scale-[0.98]"
            onClick={(event) => requestExpandedMode(event.nativeEvent, "command-center")}
            type="button"
          >
            Open workspace
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={20}
              strokeWidth={2}
              className="transition group-hover:translate-x-0.5"
            />
          </button>
        </section>

        <section className="relative hidden md:block">
          <div className="absolute -inset-8 rounded-[42px] bg-orange-500/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.96] p-4 text-[#111827] shadow-2xl">
            <div className="mb-4 flex items-center justify-between rounded-2xl bg-[#f7f9fa] px-4 py-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#576f76]">Live queue</p>
                <h2 className="text-xl font-black">Command Center</h2>
              </div>
              <span className="rounded-full bg-[#fff1eb] px-3 py-1 text-sm font-black text-[#d93a00]">2 active</span>
            </div>

            <div className="grid grid-cols-[0.82fr_1fr] gap-3">
              <div className="space-y-3">
                <PreviewQueueItem title="Spam report" status="Needs review" active />
                <PreviewQueueItem title="Rule ambiguity" status="Second opinion" />
                <PreviewQueueItem title="Already cleared" status="Resolved" />
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-[#e5ebee] bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-black">
                      <HugeiconsIcon icon={SparklesIcon} size={19} strokeWidth={1.8} />
                      Triage insight
                    </h3>
                    <span className="rounded-full bg-[#fee4e2] px-2 py-0.5 text-xs font-black text-[#b42318]">High</span>
                  </div>
                  <p className="text-sm leading-6 text-[#344054]">
                    Stronger signals point to a likely removal. Final action stays with the mod team.
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dbe3e7]">
                    <div className="h-full w-[82%] rounded-full bg-[#ff4500]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <PreviewPanel icon={ClipboardIcon} label="Rules" value="1 match" />
                  <PreviewPanel icon={TransactionHistoryIcon} label="History" value="3 actions" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export function PreviewQueueItem({ title, status, active = false }: { title: string; status: string; active?: boolean }) {
  return (
    <div
      className={`rounded-2xl border bg-white p-3 ${
        active ? "border-[#ff4500] shadow-[0_10px_24px_rgba(255,69,0,0.14)]" : "border-[#e5ebee]"
      }`}
    >
      <p className="text-sm font-black">{title}</p>
      <p className="mt-1 text-xs font-bold text-[#576f76]">{status}</p>
    </div>
  );
}

export function PreviewPanel({
  icon,
  label,
  value,
}: {
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f6f7f8] p-3">
      <HugeiconsIcon icon={icon} size={18} strokeWidth={1.8} />
      <p className="mt-3 text-xs font-bold text-[#576f76]">{label}</p>
      <p className="text-sm font-black">{value}</p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Splash />
  </StrictMode>,
);
