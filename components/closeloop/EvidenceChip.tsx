"use client";
// components/closeloop/EvidenceChip.tsx
// Clickable evidence chip linking to source utterance — stub for P5

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { cn, truncate } from "@/lib/utils";

interface EvidenceChipProps {
  utteranceId: string;
  speakerName?: string;
  quote?: string;
  onClick?: (utteranceId: string) => void;
  className?: string;
}

export function EvidenceChip({
  utteranceId,
  speakerName,
  quote,
  onClick,
  className,
}: EvidenceChipProps) {
  return (
    <motion.button
      onClick={() => onClick?.(utteranceId)}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono",
        "border border-decision/20 bg-decision/5 text-decision hover:bg-decision/10",
        "transition-colors cursor-pointer",
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      title={quote}
    >
      <Quote size={10} strokeWidth={2.5} />
      {speakerName && <span className="font-semibold">{speakerName}</span>}
      {quote && (
        <span className="text-decision/70 italic">
          "{truncate(quote, 40)}"
        </span>
      )}
    </motion.button>
  );
}

