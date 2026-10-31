// lib/parsers/transcript.ts
// Multi-Format Transcript Ingestion Parsers
// Supports: .vtt, .srt, timestamped speaker logs "[10:24] Speaker: text", docx/xml, plain text
// Robust handling of missing timestamps, unlabelled speakers, Unicode/Indian names, and malformed blocks.

export interface ParsedUtteranceTurn {
  id: string;
  seq: number;
  speakerName: string;
  tStart?: number; // seconds
  rawText: string;
}

export interface ParseResult {
  turns: ParsedUtteranceTurn[];
  uniqueSpeakers: string[];
  format: "vtt" | "srt" | "timestamped_text" | "plain_text" | "docx_xml";
}

/**
 * Main parser entry point handling multiple file types and formats.
 */
export function parseTranscriptContent(
  content: string,
  filename: string = "transcript.txt"
): ParseResult {
  if (!content || !content.trim()) {
    return {
      turns: [],
      uniqueSpeakers: [],
      format: "plain_text",
    };
  }

  const lowerName = filename.toLowerCase();

  if (lowerName.endsWith(".vtt") || content.includes("WEBVTT")) {
    return parseWebVTT(content);
  }

  if (lowerName.endsWith(".srt") || /^\d+\r?\n\d{2}:\d{2}:\d{2}/m.test(content)) {
    return parseSRT(content);
  }

  if (lowerName.endsWith(".docx") || content.includes("<w:document") || content.includes("<w:t")) {
    return parseDocxXml(content);
  }

  // Check for lines matching [10:24] Speaker: text or Speaker: text (including Unicode & Indic names)
  if (/^(?:\[\d{1,2}:\d{2}(?::\d{2})?\]\s*)?[\p{L}\p{M}\s.()-]{2,30}:\s*.+/mu.test(content)) {
    return parseSpeakerPrefixedText(content);
  }

  // Fallback to paragraph-based plain text
  return parsePlainText(content);
}

/**
 * Parses WebVTT files with <v Speaker> tags, cue lines, and malformed blocks.
 */
function parseWebVTT(content: string): ParseResult {
  const turns: ParsedUtteranceTurn[] = [];
  const speakerSet = new Set<string>();

  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let currentSpeaker = "Participant";
  let currentTime = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line === "WEBVTT" || line.startsWith("NOTE")) continue;

    // Timecode check: 00:01:20.000 --> 00:01:24.000 or 01:20.000 --> 01:24.000
    const timeMatch =
      line.match(/^(?:(\d{2}):)?(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(?:(\d{2}):)?(\d{2}):(\d{2})[.,](\d{3})/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1] || "0", 10);
      const mins = parseInt(timeMatch[2], 10);
      const secs = parseInt(timeMatch[3], 10);
      currentTime = hours * 3600 + mins * 60 + secs;
      continue;
    }

    // Voice tag check: <v Priya Nair>Hello team</v> or <v Rohan>text
    const vTagMatch = line.match(/<v\s+([^>]+)>(.*?)<\/v>/iu) || line.match(/<v\s+([^>]+)>(.*)/iu);
    if (vTagMatch) {
      currentSpeaker = vTagMatch[1].trim();
      const speech = vTagMatch[2].replace(/<\/?[^>]+(>|$)/g, "").trim();
      if (speech) {
        speakerSet.add(currentSpeaker);
        turns.push({
          id: `turn_vtt_${turns.length + 1}`,
          seq: turns.length + 1,
          speakerName: currentSpeaker,
          tStart: currentTime,
          rawText: speech,
        });
      }
      continue;
    }

    // Inline speaker check: "Priya: Hello everyone" or "Arjun Rao (Tech): ..."
    const inlineMatch = line.match(/^([\p{L}\p{M}\s.()-]{2,30}):\s*(.+)$/u);
    if (inlineMatch && !line.includes("-->")) {
      currentSpeaker = inlineMatch[1].trim();
      const speech = inlineMatch[2].trim();
      speakerSet.add(currentSpeaker);
      turns.push({
        id: `turn_vtt_${turns.length + 1}`,
        seq: turns.length + 1,
        speakerName: currentSpeaker,
        tStart: currentTime,
        rawText: speech,
      });
      continue;
    }

    // Generic speech cue line without explicit speaker
    if (!line.includes("-->") && !/^\d+$/.test(line)) {
      const cleanLine = line.replace(/<\/?[^>]+(>|$)/g, "").trim();
      if (cleanLine) {
        speakerSet.add(currentSpeaker);
        turns.push({
          id: `turn_vtt_${turns.length + 1}`,
          seq: turns.length + 1,
          speakerName: currentSpeaker,
          tStart: currentTime,
          rawText: cleanLine,
        });
      }
    }
  }

  return {
    turns,
    uniqueSpeakers: Array.from(speakerSet),
    format: "vtt",
  };
}

/**
 * Parses SubRip (.srt) files with cue blocks, handling missing or malformed blocks.
 */
function parseSRT(content: string): ParseResult {
  const turns: ParsedUtteranceTurn[] = [];
  const speakerSet = new Set<string>();

  const blocks = content.replace(/\r\n/g, "\n").split(/\n\s*\n/);

  for (let i = 0; i < blocks.length; i++) {
    const rawLines = blocks[i].trim().split("\n");
    if (rawLines.length === 0) continue;

    let timeLineIdx = -1;
    for (let j = 0; j < Math.min(3, rawLines.length); j++) {
      if (rawLines[j].includes("-->")) {
        timeLineIdx = j;
        break;
      }
    }

    let tStart = 0;
    let textStartIndex = 0;

    if (timeLineIdx !== -1) {
      const timeMatch = rawLines[timeLineIdx].match(/^(?:(\d{2}):)?(\d{2}):(\d{2})[,.](\d{3})\s*-->/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1] || "0", 10);
        const mins = parseInt(timeMatch[2], 10);
        const secs = parseInt(timeMatch[3], 10);
        tStart = hours * 3600 + mins * 60 + secs;
      }
      textStartIndex = timeLineIdx + 1;
    } else {
      // Missing timestamp line
      textStartIndex = /^\d+$/.test(rawLines[0].trim()) ? 1 : 0;
    }

    const textLines = rawLines.slice(textStartIndex).join(" ").trim();
    if (!textLines) continue;

    // Check for "Speaker: speech" format
    const speakerMatch = textLines.match(/^([\p{L}\s.()-]{2,30}):\s*(.+)$/u);
    let speakerName = "Participant";
    let rawSpeech = textLines;

    if (speakerMatch) {
      speakerName = speakerMatch[1].trim();
      rawSpeech = speakerMatch[2].trim();
    }

    speakerSet.add(speakerName);
    turns.push({
      id: `turn_srt_${turns.length + 1}`,
      seq: turns.length + 1,
      speakerName,
      tStart,
      rawText: rawSpeech,
    });
  }

  return {
    turns,
    uniqueSpeakers: Array.from(speakerSet),
    format: "srt",
  };
}

/**
 * Parses lines matching: "[10:24] Priya: ..." or "Priya: ..." or "[01:15:30] Meera Shah:"
 */
function parseSpeakerPrefixedText(content: string): ParseResult {
  const turns: ParsedUtteranceTurn[] = [];
  const speakerSet = new Set<string>();

  const lines = content.replace(/\r\n/g, "\n").split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const match = line.match(/^(?:\[?(\d{1,2}):(\d{2})(?::(\d{2}))?\]?\s*)?([\p{L}\p{M}\s.()-]{2,30}):\s*(.+)$/u);
    if (match) {
      let tStart: number | undefined;
      if (match[1] && match[2]) {
        if (match[3]) {
          tStart = parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60 + parseInt(match[3], 10);
        } else {
          tStart = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
        }
      }

      const speakerName = match[4].trim();
      const rawText = match[5].trim();
      speakerSet.add(speakerName);

      turns.push({
        id: `turn_txt_${turns.length + 1}`,
        seq: turns.length + 1,
        speakerName,
        tStart,
        rawText,
      });
    } else if (turns.length > 0) {
      // Continuation of previous turn
      turns[turns.length - 1].rawText += ` ${line}`;
    } else {
      // First line without speaker
      turns.push({
        id: `turn_txt_1`,
        seq: 1,
        speakerName: "Participant",
        rawText: line,
      });
      speakerSet.add("Participant");
    }
  }

  return {
    turns,
    uniqueSpeakers: Array.from(speakerSet),
    format: "timestamped_text",
  };
}

/**
 * Extracts text from Word XML (<w:t> tags).
 */
function parseDocxXml(content: string): ParseResult {
  const regex = /<w:t[^>]*>(.*?)<\/w:t>/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1]);
  }
  const fullText = matches.join(" ");
  return parseSpeakerPrefixedText(fullText);
}

/**
 * Plain text fallback: chunks paragraphs into turns.
 */
function parsePlainText(content: string): ParseResult {
  const paragraphs = content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const turns: ParsedUtteranceTurn[] = paragraphs.map((text, idx) => ({
    id: `turn_plain_${idx + 1}`,
    seq: idx + 1,
    speakerName: "Participant",
    rawText: text,
  }));

  return {
    turns,
    uniqueSpeakers: ["Participant"],
    format: "plain_text",
  };
}
