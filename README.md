# Closeloop (MeetFlow AI)
### Production-Grade AI Meeting-to-Execution & Institutional Memory Platform

> **Tactile Neumorphic Design System ("Tactile Obsidian & Ember") · Real Cross-Meeting Intelligence · Voice-First (Wispr Flow) · Zero-Hallucination Execution Loop**

[![Next.js](https://img.shields.io/badge/Next.js-16.2.11-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_3D-orange?style=flat-square&logo=three.js)](https://threejs.org/)
[![Tests](https://img.shields.io/badge/Vitest-65%20Passed%20(100%25)-brightgreen?style=flat-square)](file:///d:/meetflow-ai/tests)
[![AI Eval](https://img.shields.io/badge/AI_Eval-10%2F10%20(100%25)-brightgreen?style=flat-square)](file:///d:/meetflow-ai/docs/EVAL_REPORT.md)
[![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)](LICENSE)

---

## 1. Executive Summary & Product Vision

Traditional meeting transcription tools (Otter, Fireflies, Fathom, etc.) produce long, unstructured text transcripts and superficial summaries that immediately get lost in Slack channels or Notion pages. Nobody acts on them, commitments slip through the cracks, and conflicting decisions made across different meetings remain undetected until launch week.

**Closeloop** is an active **decision-memory and execution system**—not a passive transcript summarizer.

Built with Apple- and Linear-level craft, Closeloop converts conversational voice debriefs and multi-speaker round-tables into:
1. **Epistemically Rigorous Intelligence:** Distinguishes casual exploratory debate from binding decisions, confirmed milestones, and action items.
2. **Persistent Cross-Meeting Memory:** Maintains a continuous lineage graph of organizational decisions (`supersedes_id`) powered by vector embeddings.
3. **Hybrid Conflict Detection Engine:** Automatically flags contradictions in launch dates, platform scopes, budgets, and ownership across meetings before commitments are broken.
4. **Strict Human-in-the-Loop Gate:** Prevents unapproved or conflicted tasks from ever reaching production task trackers (HTTP `409 Conflict` server enforcement).
5. **Simulated Execution Loop:** A temporal **Time Machine** simulation clock that advances time, fires automated 24-hour and 2-hour reminders, and generates personalized Monday morning executive digests.

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph Ingestion ["1. Multi-Mode Voice & Transcript Ingestion"]
        V1["Voice Debrief (Wispr Flow / Speech)"]
        V2["Round-Table Multi-Speaker (Live Studio)"]
        V3["Multi-Format File Import (.txt, .vtt, .srt, .docx, .pdf)"]
    end

    subgraph Pipeline ["2. 6-Stage AI & Epistemic Intelligence Core"]
        S1["Stage 1: Speech Cleanup & Self-Correction Engine"]
        S2["Stage 2: Speaker Attribution & Roster Normalization"]
        S3["Stage 3: Schema-Bound Epistemic Extraction"]
        S4["Stage 4: Deterministic Date & Owner Resolver"]
        S5["Stage 5: Cross-Meeting Conflict Detection (pgvector)"]
        S6["Stage 6: Verbatim Grounding & Lineage Linking"]
    end

    subgraph Storage ["3. Persistent Institutional Memory"]
        DB[("PostgreSQL / In-Memory Seed Store")]
        VEC["pgvector Semantic Embeddings"]
        LIN["Decision Lineage Graph (supersedes_id)"]
    end

    subgraph Gate ["4. Human-in-the-Loop Review Gate"]
        REV["Review Tray (/review)"]
        DIFF["3D Split-Diff Conflict Visualizer"]
        LOCK["Conflict Dependency Lock & Needs-Input Guard"]
    end

    subgraph Execution ["5. Execution Loop & Task Tracker Sync"]
        SG["Server-Enforced Sync Gate (HTTP 409)"]
        ADAPT["Pluggable Adapters: InternalBoard + Trello"]
        REM["Automated Reminder Engine (24h & 2h before due)"]
    end

    subgraph Temporal ["6. Temporal Simulation & Executive Reporting"]
        TM["Time Machine Simulation Clock (/api/clock/advance)"]
        DIG["Personalized Weekly Digest (/digest)"]
        RAD["Decision Ledger & 3D Conflict Radar (/ledger)"]
        RAG["Cross-Meeting Grounded AI Assistant (Tool RAG)"]
    end

    Ingestion --> S1
    S1 --> S2 --> S3 --> S4 --> S5 --> S6
    S6 --> DB
    DB <--> VEC
    DB <--> LIN
    DB --> REV
    REV --> DIFF
    REV --> LOCK
    LOCK --> SG
    SG --> ADAPT
    ADAPT --> REM
    REM --> TM
    TM --> DIG
    DB --> RAD
    DB --> RAG
```

---

## 3. The 10 Mandated Capabilities: Traceability Matrix

Every single capability is implemented with zero compromises and empirically validated:

| # | Mandated Capability | Implementation Files & Key Components | API Endpoints & Routes |
|---|---|---|---|
| **1** | **Multi-Mode Transcript Ingestion** | [`components/studio/VoiceOrb3D.tsx`](file:///d:/meetflow-ai/components/studio/VoiceOrb3D.tsx), [`components/studio/RoundTableStudio.tsx`](file:///d:/meetflow-ai/components/studio/RoundTableStudio.tsx), [`lib/parsers/transcript.ts`](file:///d:/meetflow-ai/lib/parsers/transcript.ts) | `/studio`, `POST /api/meetings`, `POST /api/meetings/[id]/utterances` |
| **2** | **Structured AI Extraction** | [`lib/ai/pipeline/stage3-extract.ts`](file:///d:/meetflow-ai/lib/ai/pipeline/stage3-extract.ts), [`lib/ai/pipeline/stage4-resolve.ts`](file:///d:/meetflow-ai/lib/ai/pipeline/stage4-resolve.ts), [`lib/ai/schemas.ts`](file:///d:/meetflow-ai/lib/ai/schemas.ts) | `POST /api/meetings/[id]/process`, `POST /api/ai/process` |
| **3** | **Strict Epistemic Taxonomy** | [`lib/ai/pipeline/stage3-extract.ts`](file:///d:/meetflow-ai/lib/ai/pipeline/stage3-extract.ts) (Discussion, Proposal, Confirmed, Action Item, Reaffirmation, Rejection, Veto) | `app/(app)/meetings/[id]/page.tsx`, `components/review/ApprovalCard.tsx` |
| **4** | **Persistent Cross-Meeting Memory** | [`lib/ai/pipeline/stage5-memory.ts`](file:///d:/meetflow-ai/lib/ai/pipeline/stage5-memory.ts), [`lib/db/seed.ts`](file:///d:/meetflow-ai/lib/db/seed.ts) (9 seeded meetings, historical decisions, `supersedes_id` lineage) | `/ledger`, `GET /api/meetings`, `GET /api/ledger` |
| **5** | **Hybrid Conflict Detection Engine** | [`lib/ai/pipeline/stage5-memory.ts`](file:///d:/meetflow-ai/lib/ai/pipeline/stage5-memory.ts), [`components/conflicts/ConflictSplitCard.tsx`](file:///d:/meetflow-ai/components/conflicts/ConflictSplitCard.tsx), [`components/ledger/ConflictRadar3D.tsx`](file:///d:/meetflow-ai/components/ledger/ConflictRadar3D.tsx) | `POST /api/conflicts/[id]/resolve` |
| **6** | **Strict Human-in-the-Loop Gate** | [`app/(app)/review/page.tsx`](file:///d:/meetflow-ai/app/(app)/review/page.tsx), [`components/review/ApprovalCard.tsx`](file:///d:/meetflow-ai/components/review/ApprovalCard.tsx), [`app/api/sync/route.ts`](file:///d:/meetflow-ai/app/api/sync/route.ts) (HTTP 409 on unapproved/conflicted items) | `/review`, `POST /api/sync` |
| **7** | **Pluggable Task Tracker Integration** | [`lib/integrations/board-adapter.ts`](file:///d:/meetflow-ai/lib/integrations/board-adapter.ts), [`lib/integrations/trello-adapter.ts`](file:///d:/meetflow-ai/lib/integrations/trello-adapter.ts), [`app/api/sync/route.ts`](file:///d:/meetflow-ai/app/api/sync/route.ts) (Idempotent sync + external refs) | `POST /api/sync`, `POST /api/integrations/test` |
| **8** | **Time Machine Scheduler & Reminders** | [`app/api/clock/advance/route.ts`](file:///d:/meetflow-ai/app/api/clock/advance/route.ts), [`app/api/cron/tick/route.ts`](file:///d:/meetflow-ai/app/api/cron/tick/route.ts), [`components/navigation/TimeMachinePill.tsx`](file:///d:/meetflow-ai/components/navigation/TimeMachinePill.tsx) | `POST /api/clock/advance`, `POST /api/cron/tick`, `GET /api/notifications` |
| **9** | **Decision Ledger & 3D Conflict Radar** | [`app/(app)/ledger/page.tsx`](file:///d:/meetflow-ai/app/(app)/ledger/page.tsx), [`components/ledger/ConflictRadar3D.tsx`](file:///d:/meetflow-ai/components/ledger/ConflictRadar3D.tsx), [`components/ledger/LineageVisualizer.tsx`](file:///d:/meetflow-ai/components/ledger/LineageVisualizer.tsx) | `/ledger` |
| **10** | **Cross-Meeting Grounded Assistant** | [`app/api/assistant/route.ts`](file:///d:/meetflow-ai/app/api/assistant/route.ts), [`components/closeloop/AssistantPanel.tsx`](file:///d:/meetflow-ai/components/closeloop/AssistantPanel.tsx), [`components/assistant/EvidenceChip.tsx`](file:///d:/meetflow-ai/components/assistant/EvidenceChip.tsx) | `POST /api/assistant` |

---

## 4. Tactile Obsidian & Ember Design System

Closeloop features a custom **Tactile Neumorphic Physics** design system built for high-velocity executive triage:

### Visual Surface Tokens
- **Dark Theme (Default — "Obsidian Soft Clay"):**
  - Canvas: `#0B0E14`
  - Recessed Well: `#0D1017`
  - Mid Surface: `#161B26`
  - Raised Clay: `#1C2230`
  - Primary Text: `#F4F6F9` (Contrast ratio > 14:1, exceeding WCAG AAA)
  - Secondary Text: `#A8B0C0`
- **Light Theme ("Warm Alabaster Soft Clay"):**
  - Canvas: `#E6E2DD`
  - Recessed Well: `#DEDAD4`
  - Mid Surface: `#F2EFE9`
  - Raised Clay: `#FAF8F5`
  - Primary Text: `#14161B`
- **Semantic Accents:**
  - **Ember Hot (`#FF7A1A` / `#FF5500`):** Active voice capture, primary call-to-actions, and Now-Needle glow.
  - **Conflict Crimson (`#FF4D6D`):** Contradiction alerts, blocking review states.
  - **Decision Indigo (`#8C9CFF`):** Confirmed and proposed decision tags.
  - **Action Emerald (`#34D8AB`):** Concrete action items and deliverables.

### Neumorphic CSS Physics Utilities
- `.neu-raised`: Dual extruded shadow with top 1px specular highlight.
- `.neu-inset`: Deep carved recessed well for search inputs, timeline tracks, and waveform stages.
- `.neu-button`: Tactile spring button with `80ms cubic-bezier(0.34, 1.56, 0.64, 1)` click feel.
- `.neu-ember-glow`: Amber luminescence (`#FF7A1A`) indicating active voice capture or priority triage.
- `.neu-conflict-glow`: Crimson aura (`#FF4D6D`) calling attention to contradictions.

### Interactive 3D Spatial Depth (Three.js & WebGL)
- `<VoiceOrb3D />`: Custom vertex/fragment shader ferrofluid sphere that physically morphs, accelerates, and blooms with ember light in real-time response to character typing or speech velocity.
- `<ConflictRadar3D />`: Interactive 3D spatial radar charting decision clusters, historical roots, and active conflict tension arcs with orbiting controls.
- `<NowNeedle />`: Real-time IST temporal needle with pulsing 3D ember glow tracking simulated time against scheduled deliverables.

### Accessibility & Motion Safety
- Strict `@media (prefers-reduced-motion: reduce)` support in CSS and Three.js render loops.
- Keyboard-first shortcuts for Review Gate triage: `J` (next), `K` (previous), `E` (edit), `X` (reject), `Cmd+Enter` (approve & sync).

---

## 5. Built with Voice (Wispr Flow) Workflow Guide

Closeloop was engineered from the ground up for **voice-driven meeting debriefs** using **Wispr Flow**:

1. **Open Voice Studio (`/studio`)**:
   - The tactile 3D Voice Orb sits at an idle breathing frequency (0.6 Hz).
2. **Dictate via Wispr Flow**:
   - Speak naturally: *"We just wrapped our launch sync. Um, so basically our public launch is moved to December 1st, no sorry, December 1st is final. Arjun will cut the release candidate by next Thursday."*
3. **Instant Velocity Reactivity**:
   - As Wispr Flow inserts text bursts into the capture stage, Closeloop computes real-time character insertion velocity (CPS).
   - The 3D Ferrofluid Orb accelerates, blooms with ember light, and ripples in sync with your speech rhythm.
4. **Deterministic Speech Cleanup (Stage 1)**:
   - Removes conversational fillers (*"um"*, *"basically"*).
   - Detects and applies self-corrections (*"no sorry"* → locks `"December 1st"`).
   - Flags conversational digressions (*"Did anyone catch the match?"* → tagged `isDigression: true` and excluded from extraction).
5. **Direct Pipeline Hand-off**:
   - Click **"Process Meeting Intelligence"** to trigger structured extraction, date anchoring to Saturday 31 Oct 2026 IST, and conflict matching against Northstar Labs' persistent memory.

---

## 6. Getting Started & Running Locally

Closeloop is completely **zero-configuration ready**. The application runs out of the box with an in-memory mutable store initialized with Northstar Labs' complete 9-meeting dataset.

### Prerequisites
- Node.js 20+
- npm or pnpm

### Quick Start
```bash
# Clone the repository
git clone https://github.com/Ashish-800/Momentum.git
cd Momentum

# Install dependencies
npm install

# Run automated test suite (65 tests across 6 files)
npm test

# Run 10-case AI evaluation & adversarial harness
npm run eval

# Start local Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the Command Center dashboard.

### Environment Configuration (`.env.local`)
Copy [`.env.example`](file:///d:/meetflow-ai/.env.example) to `.env.local` to customize providers:
```bash
cp .env.example .env.local
```

```env
# Database: PostgreSQL with pgvector (Supabase or Neon)
DATABASE_URL="postgresql://postgres:password@localhost:5432/closeloop"

# AI Inference (Anthropic SDK)
ANTHROPIC_API_KEY="sk-ant-api03-..."
ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"

# Vector Embeddings: "voyage" | "openai"
EMBEDDINGS_PROVIDER="voyage"
VOYAGE_API_KEY="pa-..."
OPENAI_API_KEY="sk-proj-..."

# External Task Tracker: Trello Adapter
TRELLO_KEY="your-trello-developer-key"
TRELLO_TOKEN="your-trello-oauth-token"
TRELLO_BOARD_ID="your-trello-board-id"

# Notification & Digest Delivery: Resend
RESEND_API_KEY="re_..."

# Offline / Zero-Config Demo Mode
# When true, operates cleanly against seeded in-memory data without external APIs
DEMO_FALLBACK="true"

# App URL & Workspace Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_WORKSPACE_ID="ws_northstar_001"
```

---

## 7. The 3-Minute Live Golden Demo Script

Follow this step-by-step walkthrough to experience the entire closed-loop workflow:

### Step 1: Command Center (`/`)
- View the simulated clock at **Saturday, 31 Oct 2026 12:43 IST**.
- Observe the **Now-Needle** timeline, active projects, and the glowing red **Schedule Conflict Alert** (15 Nov vs 1 Dec launch date).
- Click the floating **Guided Demo Tour** pill at bottom-right for live coaching tips.

### Step 2: 3D Voice Studio (`/studio`)
- Switch between **Voice Debrief**, **Round-Table**, and **Import Transcript**.
- In Voice Debrief, click **"Load Demo Dictation"** to populate a transcript with spoken self-corrections, fillers, and digressions.
- Watch `<VoiceOrb3D />` react dynamically to typing velocity.
- Click **"Process Intelligence"** to trigger the 6-stage pipeline.

### Step 3: Meeting Detail (`/meetings/meet_launch_planning_001`)
- Toggle between **Clean Transcript** and **Raw Transcript**.
- Observe self-correction strikethroughs (*"November 15th"* → *"December 1st"*).
- Click any decision or action item to trigger **Bidirectional Evidence Highlighting** in the transcript.
- Open the **AI Inspection Drawer** (`<AiTraceDrawer />`) to audit raw prompts, token usage, latency, and calibrated confidence.

### Step 4: Review Gate & 3D Split Conflict Resolution (`/review`)
- Review staged proposals. Notice Arjun's release branch task displays a **Conflict Lock** banner and **Needs-Input Guard**.
- Try clicking **"Approve & Sync"** without resolving: notice the server-enforced rejection (HTTP `409 Conflict`).
- Open the **3D Split-Diff Conflict Card**: compare Confirmed DEC-001 (15 Nov) against Proposed DEC-002 (1 Dec).
- Click **"Adopt 1 Dec (Supersede Old)"**.
- The lineage updates instantly: old decision is marked `superseded`, new decision is `active` with `supersedes_id` link.
- Arjun's dependent task is updated with suggested date (`Thu, 5 Nov`). Approve the task!

### Step 5: Task Tracker Sync (`/review` → `/week`)
- Select the approved tasks and choose **"Internal Board"** (or Trello).
- Click **"Sync to Tracker"**.
- The server validates approvals, schedules automated **24-hour and 2-hour reminders**, and moves tasks to `/week`.
- Switch between **Kanban Board** and **Execution List** views in `/week`.

### Step 6: Time Machine Temporal Jump (`<TimeMachinePill />`)
- Click the simulated clock pill at bottom-left.
- Click **"Jump to Mon 9:00 AM"** (advances clock to Monday, 2 Nov 2026 09:00 IST).
- Notice:
  1. The 24-hour reminder for Arjun's release branch **fires immediately** into the Notifications Drawer.
  2. The system generates **Personalized Weekly Digests** for all 5 team members!

### Step 7: Weekly Digest (`/digest`)
- Switch between team member tabs (**Priya**, **Arjun**, **Meera**, **Rohan**, **Sana**).
- Review each member's customized commitment brief, urgent action items, and the calculated **Time-Saved ROI** metric.

### Step 8: Decision Ledger & 3D Conflict Radar (`/ledger`)
- Inspect the full institutional memory graph across all 9 meetings.
- Trace decision lineage showing DEC-001 superseded by DEC-002.
- Orbit and zoom the **3D Conflict Radar** to explore decision nodes, clustering, and resolved conflict arcs.

### Step 9: Grounded Cross-Meeting AI Assistant (`Cmd+K` or Assistant Drawer)
- Click the AI Assistant icon in the sidebar or press `Cmd+K`.
- Ask: *"What is our current official launch date and budget?"*
- Observe the instant, grounded answer with **verbatim clickable citations** (`<EvidenceChip />`) linking directly to source meetings and decisions with zero hallucinations.

---

## 8. Test Suite & Evaluation Results

Closeloop has been verified with a comprehensive testing matrix:

```bash
# Execute Vitest Suite
npm test

# Results:
✓ tests/unit/resolver.test.ts (13 tests)
✓ tests/unit/parsers.test.ts (11 tests)
✓ tests/unit/speech-cleanup.test.ts (23 tests)
✓ tests/unit/conflict-guards.test.ts (6 tests)
✓ tests/integration/api-gates.test.ts (9 tests)
✓ tests/integration/golden-flow.test.ts (3 tests)

Test Files  6 passed (6)
Tests       65 passed (65)
```

```bash
# Execute 10-Case AI Evaluation Harness
npm run eval

# Results:
[Case 1/10]  ✓ PASS: Standard Demo Recap (Mobile v2 Multi-Conflict Sync)
[Case 2/10]  ✓ PASS: Discussion Without Decision (Exploratory Brainstorming)
[Case 3/10]  ✓ PASS: Explicitly Rejected Proposal (In-Meeting Veto)
[Case 4/10]  ✓ PASS: In-Meeting Reversal (Overturned by Later Consensus)
[Case 5/10]  ✓ PASS: Reaffirmation Only (Status Quo Confirmation)
[Case 6/10]  ✓ PASS: Ambiguous Ownership & Unanchored Deadline (needs_input Guard)
[Case 7/10]  ✓ PASS: Cross-Project Isolation (Multi-Project Boundary)
[Case 8/10]  ✓ PASS: Hinglish & Indian Number Formatting (4 Lakhs & Vernacular)
[Case 9/10]  ✓ PASS: Long-Context Multi-Speaker Sync (30+ turns)
[Case 10/10] ✓ PASS: Adversarial Prompt Injection (Safety Guardrail)

EVALUATION SUMMARY: 10/10 PASSED (100%)
• Conflict Precision: 100.0%
• Conflict Recall:    100.0%
• Conflict F1 Score:  1.000
• False-Positive Conflict Rate: 0%
```

See [`docs/TEST_REPORT.md`](file:///d:/meetflow-ai/docs/TEST_REPORT.md) for full benchmark and audit logs.

---

## 9. Project Directory Structure

```
meetflow-ai/
├── app/                                 # Next.js 16 App Router
│   ├── (app)/                           # Authenticated workspace routes
│   │   ├── digest/                      # Weekly Digest with 5-member tabs
│   │   ├── home/                        # Command Center dashboard
│   │   ├── ledger/                      # Decision Ledger & 3D Conflict Radar
│   │   ├── meetings/[id]/               # Meeting Detail with bidirectional evidence
│   │   ├── review/                      # Review Gate & 3D Split Conflict Resolution
│   │   ├── settings/                    # Integration & workspace settings
│   │   ├── studio/                      # 3D Voice Studio & Ingestion
│   │   └── week/                        # My Week execution board (Kanban & List)
│   ├── api/                             # REST API handlers
│   │   ├── assistant/                   # Grounded cross-meeting RAG assistant
│   │   ├── clock/advance/               # Time Machine simulation clock
│   │   ├── conflicts/[id]/resolve/      # Conflict resolution & lineage updates
│   │   ├── cron/tick/                   # Automated reminder scheduler tick
│   │   ├── meetings/                    # Meeting ingestion & processing
│   │   └── sync/                        # Server-enforced task tracker sync gate
│   ├── globals.css                      # Tactile Obsidian & Ember CSS variables
│   └── layout.tsx                       # Root layout & font configurations
├── components/                          # React 19 UI Components
│   ├── assistant/                       # AI Assistant drawer & evidence chips
│   ├── closeloop/                       # App shell, sidebar, and command palette
│   ├── conflicts/                       # 3D Split-Diff conflict cards
│   ├── ledger/                          # 3D Conflict Radar & Lineage Visualizer
│   ├── navigation/                      # Time Machine pill & Notifications drawer
│   ├── review/                          # Approval cards & Needs-Input guards
│   ├── studio/                          # VoiceOrb3D, RoundTable, & file dropzone
│   └── ui/                              # Radix UI primitives with Neumorphic styles
├── docs/                                # Documentation & evaluation reports
│   ├── EVAL_REPORT.md                   # 10-Case AI evaluation harness report
│   └── TEST_REPORT.md                   # Full QA verification & test runbook
├── lib/                                 # Business logic & engines
│   ├── ai/                              # 6-stage intelligence pipeline & client
│   │   ├── pipeline/                    # Stages 1 to 6 implementation
│   │   ├── speech-cleanup-engine.ts     # Deterministic speech cleanup
│   │   ├── client.ts                    # Resilient Anthropic client & traces
│   │   └── schemas.ts                   # Zod schemas for epistemic validation
│   ├── db/                              # Database schema & in-memory seed data
│   │   ├── schema.ts                    # Drizzle ORM schema with pgvector
│   │   └── seed.ts                      # Northstar Labs 9-meeting demo dataset
│   ├── integrations/                    # InternalBoard & Trello adapters
│   └── parsers/                         # Multi-format transcript parsers
├── scripts/                             # Utility & evaluation scripts
│   └── eval-ai.ts                       # 10-case AI evaluation benchmark runner
├── tests/                               # Vitest automated test suite
│   ├── integration/                     # API gates & golden flow tests
│   └── unit/                            # Speech cleanup, parser, & resolver tests
├── .env.example                         # Example environment variables
├── package.json                         # Dependencies & npm scripts
├── tailwind.config.ts                   # Tailwind theme extensions
└── vitest.config.ts                     # Vitest test configuration
```

---

## 10. License & Credits

Built with precision by the **Closeloop Engineering Team**.  
Designed with Apple & Linear level craft: Tactile Obsidian & Ember, Neumorphic Depth, and Spatial Motion.
Distributed under the MIT License.
