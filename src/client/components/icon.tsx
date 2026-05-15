import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  Alert01Icon,
  ArchiveIcon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  BrainIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  CheckmarkSquare01Icon,
  ClipboardIcon,
  Flag01Icon,
  Message01Icon,
  RefreshIcon,
  Settings01Icon,
  Shield01Icon,
  SparklesIcon,
  TransactionHistoryIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "../lib/cn";

const icons = {
  alert: Alert01Icon,
  archive: ArchiveIcon,
  brain: BrainIcon,
  check: CheckmarkSquare01Icon,
  checkCircle: CheckmarkCircle01Icon,
  chevronDown: ArrowDown01Icon,
  chevronRight: ArrowRight01Icon,
  clipboard: ClipboardIcon,
  flag: Flag01Icon,
  history: TransactionHistoryIcon,
  message: Message01Icon,
  refresh: RefreshIcon,
  settings: Settings01Icon,
  shield: Shield01Icon,
  sparkles: SparklesIcon,
  x: Cancel01Icon,
} satisfies Record<string, IconSvgElement>;

export type IconName = keyof typeof icons;

export function Icon({
  name,
  size = 18,
  className,
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  className?: string | undefined;
  strokeWidth?: number;
}) {
  return (
    <HugeiconsIcon
      icon={icons[name]}
      size={size}
      strokeWidth={strokeWidth}
      className={cn("shrink-0", className)}
      aria-hidden="true"
    />
  );
}
