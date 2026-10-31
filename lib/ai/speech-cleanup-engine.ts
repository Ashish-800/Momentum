// lib/ai/speech-cleanup-engine.ts
// Deterministic Speech Cleanup, Self-Correction & Digression Engine
// Supports 15+ conversational self-correction patterns, conversational filler removal,
// preservation of grammatical "like" and "basically", and digression tagging.

export interface CorrectionRecord {
  original: string;
  replacement: string;
  kind: "self-correction" | "filler" | "digression";
  rationale?: string;
}

export interface CleanTextResult {
  rawText: string;
  cleanText: string;
  isDigression: boolean;
  corrections: CorrectionRecord[];
}

// 15+ Conversational self-correction patterns
const SELF_CORRECTION_PATTERNS: Array<{
  regex: RegExp;
  extract: (match: RegExpMatchArray) => { original: string; replacement: string; rationale: string };
}> = [
  // 1. "X, no, sorry, Y" / "by X, no, sorry, Y"
  {
    regex: /\b(?:(by|on|at|in|to|for)\s+)?([A-Za-z0-9]+?),\s*no(?:,)?\s*sorry(?:,)?\s+([A-Za-z0-9\s]+?)(?=[.,;!?]|$)/i,
    extract: (m) => {
      const prep = m[1] ? `${m[1]} ` : "";
      return {
        original: m[0],
        replacement: `${prep}${m[3].trim()}`,
        rationale: "Self-correction via 'no sorry'",
      };
    },
  },
  // 2. "X, I mean Y"
  {
    regex: /\b([A-Za-z0-9\s]+?),\s*I mean\s+([A-Za-z0-9\s]+?)(?=[.,;!?]|$)/i,
    extract: (m) => ({
      original: m[0],
      replacement: m[2].trim(),
      rationale: "Self-correction via 'I mean'",
    }),
  },
  // 3. "X, scratch that, Y" / "X, scratch that Y"
  {
    regex: /\b([A-Za-z0-9\s]+?),\s*scratch that(?:,)?\s+([A-Za-z0-9\s]+?)(?=[.,;!?]|$)/i,
    extract: (m) => ({
      original: m[0],
      replacement: m[2].trim(),
      rationale: "Self-correction via 'scratch that'",
    }),
  },
  // 4. "X, actually make it Y" / "X actually make it Y"
  {
    regex: /\b([A-Za-z0-9\s]+?)(?:,)?\s*actually make it\s+([A-Za-z0-9\s]+?)(?=[.,;!?]|$)/i,
    extract: (m) => ({
      original: m[0],
      replacement: m[2].trim(),
      rationale: "Self-correction via 'actually make it'",
    }),
  },
  // 5. "X, wait no, Y" / "X, wait no Y"
  {
    regex: /\b([A-Za-z0-9\s]+?),\s*wait(?:,)?\s*no(?:,)?\s+([A-Za-z0-9\s]+?)(?=[.,;!?]|$)/i,
    extract: (m) => ({
      original: m[0],
      replacement: m[2].trim(),
      rationale: "Self-correction via 'wait no'",
    }),
  },
  // 6. "X, or rather, Y" / "X, or rather Y"
  {
    regex: /\b([A-Za-z0-9\s]+?),\s*or rather(?:,)?\s+([A-Za-z0-9\s]+?)(?=[.,;!?]|$)/i,
    extract: (m) => ({
      original: m[0],
      replacement: m[2].trim(),
      rationale: "Self-correction via 'or rather'",
    }),
  },
  // 7. "X, rather, Y"
  {
    regex: /\b([A-Za-z0-9\s]+?),\s*rather(?:,)?\s+([A-Za-z0-9\s]+?)(?=[.,;!?]|$)/i,
    extract: (m) => ({
      original: m[0],
      replacement: m[2].trim(),
      rationale: "Self-correction via 'rather'",
    }),
  },
  // 8. "X, let's change that to Y"
  {
    regex: /\b([A-Za-z0-9\s]+?),\s*let['’]s change that to\s+([A-Za-z0-9\s]+?)(?=[.,;!?]|$)/i,
    extract: (m) => ({
      original: m[0],
      replacement: m[2].trim(),
      rationale: "Self-correction via 'let's change that to'",
    }),
  },
  // 9. "not X, but Y" / "not X, Y"
  {
    regex: /\bnot\s+([A-Za-z0-9\s]+?),\s*(?:but\s+)?([A-Za-z0-9\s]+?)(?=[.,;!?]|$)/i,
    extract: (m) => ({
      original: m[0],
      replacement: m[2].trim(),
      rationale: "Self-correction via 'not X, but Y'",
    }),
  },
  // 10. "X, strike that, Y"
  {
    regex: /\b([A-Za-z0-9\s]+?),\s*strike that(?:,)?\s+([A-Za-z0-9\s]+?)(?=[.,;!?]|$)/i,
    extract: (m) => ({
      original: m[0],
      replacement: m[2].trim(),
      rationale: "Self-correction via 'strike that'",
    }),
  },
  // 11. "X, my bad, Y"
  {
    regex: /\b([A-Za-z0-9\s]+?),\s*my bad(?:,)?\s+([A-Za-z0-9\s]+?)(?=[.,;!?]|$)/i,
    extract: (m) => ({
      original: m[0],
      replacement: m[2].trim(),
      rationale: "Self-correction via 'my bad'",
    }),
  },
  // 12. "X, correction, Y"
  {
    regex: /\b([A-Za-z0-9\s]+?),\s*correction(?:,)?\s+([A-Za-z0-9\s]+?)(?=[.,;!?]|$)/i,
    extract: (m) => ({
      original: m[0],
      replacement: m[2].trim(),
      rationale: "Self-correction via 'correction'",
    }),
  },
  // 13. "X, I misspoke, Y"
  {
    regex: /\b([A-Za-z0-9\s]+?),\s*I misspoke(?:,)?\s+([A-Za-z0-9\s]+?)(?=[.,;!?]|$)/i,
    extract: (m) => ({
      original: m[0],
      replacement: m[2].trim(),
      rationale: "Self-correction via 'I misspoke'",
    }),
  },
  // 14. "X, make that Y"
  {
    regex: /\b([A-Za-z0-9\s]+?),\s*make that\s+([A-Za-z0-9\s]+?)(?=[.,;!?]|$)/i,
    extract: (m) => ({
      original: m[0],
      replacement: m[2].trim(),
      rationale: "Self-correction via 'make that'",
    }),
  },
  // 15. "X, let me rephrase, Y"
  {
    regex: /\b([A-Za-z0-9\s]+?),\s*let me rephrase(?:,)?\s+([A-Za-z0-9\s]+?)(?=[.,;!?]|$)/i,
    extract: (m) => ({
      original: m[0],
      replacement: m[2].trim(),
      rationale: "Self-correction via 'let me rephrase'",
    }),
  },
  // 16. "X, actually Y" (e.g., "by Friday, actually Monday")
  {
    regex: /\b(?:(by|on|at|in|to|for)\s+)?([A-Za-z0-9]+?),\s*actually\s+([A-Za-z0-9\s]+?)(?=[.,;!?]|$)/i,
    extract: (m) => {
      const prep = m[1] ? `${m[1]} ` : "";
      return {
        original: m[0],
        replacement: `${prep}${m[3].trim()}`,
        rationale: "Self-correction via 'actually'",
      };
    },
  },
];

// Digression detection keywords
const DIGRESSION_REGEX =
  /\b(?:biryani|lunch|coffee|tea|dinner|pizza|burger|snack|food|restaurant|traffic|weather|movie|weekend|netflix|cricket|football|concert)\b/i;

/**
 * Clean a single spoken sentence/utterance deterministically.
 */
export function cleanSpokenUtterance(text: string): CleanTextResult {
  const corrections: CorrectionRecord[] = [];
  let working = text.trim();

  // 1. Digression check
  const isDigression = DIGRESSION_REGEX.test(working);
  if (isDigression) {
    corrections.push({
      original: working,
      replacement: "[Off-topic digression hidden]",
      kind: "digression",
      rationale: "Flagged off-topic conversational tangent",
    });
  }

  // 2. Resolve Self-Corrections
  for (const pattern of SELF_CORRECTION_PATTERNS) {
    const match = working.match(pattern.regex);
    if (match) {
      const { original, replacement, rationale } = pattern.extract(match);
      corrections.push({
        original,
        replacement,
        kind: "self-correction",
        rationale,
      });
      working = working.replace(original, replacement);
    }
  }

  // 3. Remove Fillers ("um", "uh", "you know", "like" when filler, "basically" when filler)
  // Preserve grammatical "like": "looks like", "feels like", "sounds like", "something like", "like a"
  // Preserve grammatical "basically": "is basically", "basically complete", "basically done", "basically finished"

  // Temporary protect grammatical "like" and "basically"
  const placeholders: Array<{ token: string; value: string }> = [];
  let tokenIdx = 0;

  const preservePatterns = [
    /\b(?:looks|feels|sounds|seems|acts|something|more|much)\s+like\b/gi,
    /\blike\s+(?:a|an|the|this|that|these|those)\b/gi,
    /\b(?:is|are|was|were)\s+basically\b/gi,
    /\bbasically\s+(?:complete|finished|done|ready|working|operational|functional)\b/gi,
  ];

  for (const pres of preservePatterns) {
    working = working.replace(pres, (match) => {
      const placeholder = `__PRES_${tokenIdx++}__`;
      placeholders.push({ token: placeholder, value: match });
      return placeholder;
    });
  }

  // Strip standalone fillers
  const fillerRegexes: Array<{ regex: RegExp; name: string }> = [
    { regex: /\b(?:um|uh|er|ah|umm|uhh)\b[,]?\s*/gi, name: "um/uh" },
    { regex: /\b(?:you know)\b[,]?\s*/gi, name: "you know" },
    { regex: /(?:^|[,\s])like[,\s]+/gi, name: "filler like" },
    { regex: /(?:^|[,\s])basically[,\s]+/gi, name: "filler basically" },
  ];

  for (const { regex, name } of fillerRegexes) {
    const matches = working.match(regex);
    if (matches) {
      matches.forEach((m) => {
        corrections.push({
          original: m.trim(),
          replacement: "",
          kind: "filler",
          rationale: `Removed conversational filler '${name}'`,
        });
      });
      working = working.replace(regex, " ");
    }
  }

  // Restore preserved grammatical phrases
  for (const { token, value } of placeholders) {
    working = working.replace(token, value);
  }

  // Clean extra whitespace and punctuation artifacts
  working = working
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/^[,.\s]+/, "")
    .trim();

  // Capitalize first letter
  if (working.length > 0) {
    working = working.charAt(0).toUpperCase() + working.slice(1);
  }

  return {
    rawText: text,
    cleanText: working,
    isDigression,
    corrections,
  };
}
