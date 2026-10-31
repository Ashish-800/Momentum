// tests/unit/parsers.test.ts
// Unit tests for multi-format transcript parsers

import { describe, it, expect } from "vitest";
import { parseTranscriptContent } from "@/lib/parsers/transcript";

describe("Multi-Format Transcript Parsers", () => {
  describe("WebVTT (.vtt) Parsing", () => {
    it("parses valid WebVTT with <v Speaker> voice tags", () => {
      const vtt = `WEBVTT

00:00:01.000 --> 00:00:04.500
<v Priya Nair>Welcome everyone to the launch readiness sync.</v>

00:00:05.000 --> 00:00:08.200
<v Arjun Rao>Android client build is passing all smoke tests.</v>`;

      const result = parseTranscriptContent(vtt, "meeting.vtt");
      expect(result.format).toBe("vtt");
      expect(result.turns).toHaveLength(2);
      expect(result.turns[0].speakerName).toBe("Priya Nair");
      expect(result.turns[0].tStart).toBe(1);
      expect(result.turns[0].rawText).toBe("Welcome everyone to the launch readiness sync.");
      expect(result.turns[1].speakerName).toBe("Arjun Rao");
      expect(result.turns[1].tStart).toBe(5);
      expect(result.uniqueSpeakers).toContain("Priya Nair");
      expect(result.uniqueSpeakers).toContain("Arjun Rao");
    });

    it("handles WebVTT with inline speaker prefixes and missing header gracefully", () => {
      const vtt = `00:01:10.000 --> 00:01:15.000
Meera Shah: Design freeze is set for Monday.

00:01:16.000 --> 00:01:20.000
Rohan Gupta: Marketing copy is drafted.`;

      const result = parseTranscriptContent(vtt, "subtitles.vtt");
      expect(result.turns).toHaveLength(2);
      expect(result.turns[0].speakerName).toBe("Meera Shah");
      expect(result.turns[0].tStart).toBe(70);
      expect(result.turns[1].speakerName).toBe("Rohan Gupta");
    });

    it("handles malformed WebVTT with extra blank lines and cue comments", () => {
      const vtt = `WEBVTT
NOTE This is an internal meeting recording

00:00:02.000 --> 00:00:05.000
Sana Khan: We have 42 regression test cases ready.


`;
      const result = parseTranscriptContent(vtt, "meeting.vtt");
      expect(result.turns).toHaveLength(1);
      expect(result.turns[0].speakerName).toBe("Sana Khan");
      expect(result.turns[0].rawText).toContain("42 regression test cases");
    });
  });

  describe("SubRip (.srt) Parsing", () => {
    it("parses valid SRT blocks with speaker prefixes", () => {
      const srt = `1
00:00:10,000 --> 00:00:14,000
Priya Nair: Let's discuss the 1 December launch date proposal.

2
00:00:15,000 --> 00:00:19,500
Arjun Rao: Agreed, offline indexing needs the buffer.`;

      const result = parseTranscriptContent(srt, "call.srt");
      expect(result.format).toBe("srt");
      expect(result.turns).toHaveLength(2);
      expect(result.turns[0].speakerName).toBe("Priya Nair");
      expect(result.turns[0].tStart).toBe(10);
      expect(result.turns[0].rawText).toContain("1 December launch date");
      expect(result.turns[1].speakerName).toBe("Arjun Rao");
      expect(result.turns[1].tStart).toBe(15);
    });

    it("handles SRT with unlabelled speaker falling back to Participant", () => {
      const srt = `1
00:00:05,000 --> 00:00:08,000
Can everyone hear me clearly?`;

      const result = parseTranscriptContent(srt, "session.srt");
      expect(result.turns).toHaveLength(1);
      expect(result.turns[0].speakerName).toBe("Participant");
      expect(result.turns[0].rawText).toBe("Can everyone hear me clearly?");
    });

    it("handles malformed SRT with missing sequence numbers or timestamps", () => {
      const srt = `Priya Nair: We need to finalize the budget today.

2
00:00:20,000 --> 00:00:24,000
Rohan Gupta: 4 lakhs is locked.`;

      const result = parseTranscriptContent(srt, "recording.srt");
      expect(result.turns.length).toBeGreaterThanOrEqual(1);
      expect(result.uniqueSpeakers.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Timestamped Text & Document Extraction (.txt / .docx)", () => {
    it("parses standard [MM:SS] Speaker: Text timestamps", () => {
      const text = `[02:15] Priya Nair: Mobile v2 release candidate is ready.
[02:40] Meera Shah: Figma components are in final review.
[03:10] Arjun Rao: CI pipeline triggered for QA handoff.`;

      const result = parseTranscriptContent(text, "notes.txt");
      expect(result.format).toBe("timestamped_text");
      expect(result.turns).toHaveLength(3);
      expect(result.turns[0].speakerName).toBe("Priya Nair");
      expect(result.turns[0].tStart).toBe(135);
      expect(result.turns[1].speakerName).toBe("Meera Shah");
      expect(result.turns[1].tStart).toBe(160);
      expect(result.turns[2].speakerName).toBe("Arjun Rao");
      expect(result.turns[2].tStart).toBe(190);
    });

    it("handles Unicode & Indian names properly", () => {
      const text = `Priya Nair: Testing Unicode attribution.
आरव शर्मा: Hindi name representation in transcript.
Meera Shah (Design): Design specs confirmed.`;

      const result = parseTranscriptContent(text, "multilingual.txt");
      expect(result.turns.length).toBe(3);
      expect(result.uniqueSpeakers).toContain("Priya Nair");
      expect(result.uniqueSpeakers).toContain("आरव शर्मा");
      expect(result.uniqueSpeakers).toContain("Meera Shah (Design)");
    });

    it("parses Word docx XML text extraction with <w:t> tags", () => {
      const xml = `<w:document><w:body><w:p><w:r><w:t>Priya Nair: Launch date confirmed.</w:t></w:r></w:p></w:body></w:document>`;
      const result = parseTranscriptContent(xml, "brief.docx");
      expect(result.turns).toHaveLength(1);
      expect(result.turns[0].speakerName).toBe("Priya Nair");
      expect(result.turns[0].rawText).toContain("Launch date confirmed");
    });

    it("handles plain unstructured paragraphs cleanly", () => {
      const text = `This is the first discussion block without any explicit speaker names.

This is the second topic covering budget numbers and timeline allocations.`;

      const result = parseTranscriptContent(text, "plain.txt");
      expect(result.format).toBe("plain_text");
      expect(result.turns).toHaveLength(2);
      expect(result.turns[0].speakerName).toBe("Participant");
    });

    it("returns empty result on empty or whitespace content", () => {
      const result = parseTranscriptContent("", "empty.txt");
      expect(result.turns).toHaveLength(0);
      expect(result.uniqueSpeakers).toHaveLength(0);
    });
  });
});

