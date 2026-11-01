// lib/db/seed.ts
// Momentum — Production-Grade Seed Dataset
// Workspace: Northstar Labs | Sim Clock: 2026-10-31T12:43:00+05:30 (IST)

export const SEED_IDS = {
  WORKSPACE_ID: "ws_northstar_001",

  // 5 Team Members
  PERSON_PRIYA: "person_priya_nair",     // Product Manager (#FF7A1A)
  PERSON_ARJUN: "person_arjun_rao",      // Engineering Lead (#8C9CFF)
  PERSON_MEERA: "person_meera_shah",     // Design Lead (#34D8AB)
  PERSON_ROHAN: "person_rohan_gupta",    // Marketing Lead (#FFC247)
  PERSON_SANA: "person_sana_khan",       // QA Lead (#FF4D6D)

  // Primary Project
  PROJECT_MOBILE_V2: "proj_mobile_v2",

  // Meetings (Meeting 1, Meeting 2, + 7 Historical Meetings = 9 total)
  MEET_1_LAUNCH_PLANNING: "meet_launch_planning_001",
  MEET_2_SCOPE_REVIEW: "meet_scope_review_002",
  MEET_3_DESIGN_CRITIQUE: "meet_design_critique_003",
  MEET_4_SUSTAINABILITY: "meet_sustainability_004",
  MEET_5_ANALYTICS: "meet_analytics_005",
  MEET_6_MARKETING: "meet_marketing_006",
  MEET_7_UX_SUMMIT: "meet_ux_summit_007",
  MEET_8_TECH_WORKSHOP: "meet_tech_workshop_008",
  MEET_9_QUARTERLY_REVIEW: "meet_quarterly_review_009",

  // Confirmed & Proposed Decisions
  DEC_LAUNCH_DATE: "dec_launch_date_001",
  DEC_MARKETING_BUDGET: "dec_marketing_budget_001",
  DEC_CAMPAIGN_OWNERSHIP: "dec_campaign_ownership_001",
  DEC_ANDROID_FIRST: "dec_android_first_001",
  DEC_DESIGN_FREEZE: "dec_design_freeze_001",
  DEC_CONFLICT_PROPOSED: "dec_conflict_proposed_001", // Clash: Delay Android to Dec 1

  // Action Items
  ACTION_ROHAN_CAMPAIGN_BRIEF: "act_rohan_campaign_brief",
  ACTION_ARJUN_RELEASE_BRANCH: "act_arjun_release_branch", // DUE WITHIN 24 HOURS
  ACTION_MEERA_FIGMA: "act_meera_figma",
  ACTION_SANA_TEST_PLAN: "act_sana_test_plan",

  // Pending Approvals (Batch of 3 items for Review Gate)
  PENDING_DEC_NOTIFICATION_VENDOR: "pending_dec_notification_vendor",
  PENDING_ACT_LOAD_TESTING: "pending_act_load_testing",
  PENDING_ACT_LOCALIZATION: "pending_act_localization",

  // Conflict
  CONFLICT_SCHEDULE_CLASH: "conf_schedule_clash_001",
};

export const seedWorkspace = {
  id: SEED_IDS.WORKSPACE_ID,
  name: "Northstar Labs",
  slug: "northstar",
  timezone: "Asia/Kolkata",
  simNow: new Date("2026-10-31T07:13:00Z"), // 12:43 IST (UTC+5:30)
  createdAt: new Date("2026-08-01T00:00:00Z"),
};

export const seedPeople = [
  {
    id: SEED_IDS.PERSON_PRIYA,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    name: "Priya Nair",
    role: "Product Manager",
    email: "priya.nair@northstar.ai",
    avatarUrl: null,
    accentColor: "#FF7A1A", // Ember
  },
  {
    id: SEED_IDS.PERSON_ARJUN,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    name: "Arjun Rao",
    role: "Engineering Lead",
    email: "arjun.rao@northstar.ai",
    avatarUrl: null,
    accentColor: "#8C9CFF", // Indigo
  },
  {
    id: SEED_IDS.PERSON_MEERA,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    name: "Meera Shah",
    role: "Design Lead",
    email: "meera.shah@northstar.ai",
    avatarUrl: null,
    accentColor: "#34D8AB", // Mint
  },
  {
    id: SEED_IDS.PERSON_ROHAN,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    name: "Rohan Gupta",
    role: "Marketing Lead",
    email: "rohan.gupta@northstar.ai",
    avatarUrl: null,
    accentColor: "#FFC247", // Amber
  },
  {
    id: SEED_IDS.PERSON_SANA,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    name: "Sana Khan",
    role: "QA Lead",
    email: "sana.khan@northstar.ai",
    avatarUrl: null,
    accentColor: "#FF4D6D", // Rose
  },
];

export const seedProjects = [
  {
    id: SEED_IDS.PROJECT_MOBILE_V2,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    name: "Mobile v2 Launch",
    code: "MV2",
    description: "Next-generation Android & iOS client apps with real-time sync and Wispr Flow voice dictation.",
  },
];

// ── Meetings (Meeting 1 & 2 + 7 Additional = 9 total) ────────
export const seedMeetings = [
  {
    id: SEED_IDS.MEET_1_LAUNCH_PLANNING,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    title: "Mobile v2 Launch Planning & Budget Alignment",
    meetingDate: new Date("2026-10-12T10:00:00+05:30"),
    durationMin: 52,
    captureMode: "roundtable" as const,
    status: "processed" as const,
    summary:
      "Priya convened the core leads to lock down the launch schedule and financial envelope. Confirmed launch date of 15 November 2026, locked marketing spend to 4,00,000 INR under Rohan's ownership, and tasked Arjun with cutting the release branch on 1 November.",
    highlights: {
      key_decisions: [
        "Public launch date locked for 15 November 2026",
        "Marketing budget capped at 4,00,000 INR",
        "Rohan Gupta designated sole owner of launch campaign",
      ],
      blockers: [],
      open_questions: ["Will Play Store staged rollout require 72 hours buffer?"],
    },
    rawFileMeta: { platform: "google_meet", participants: ["Priya", "Arjun", "Rohan", "Meera", "Sana"] },
    createdAt: new Date("2026-10-12T11:00:00+05:30"),
  },
  {
    id: SEED_IDS.MEET_2_SCOPE_REVIEW,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    title: "Mobile v2 Platform Scope & Design Freeze",
    meetingDate: new Date("2026-10-19T14:30:00+05:30"),
    durationMin: 45,
    captureMode: "roundtable" as const,
    status: "processed" as const,
    summary:
      "Arjun reviewed native performance benchmarks across Android and iOS builds. To maximize early momentum, the team confirmed an Android-first rollout on 15 November, followed by iOS 14 days later. Meera locked the design freeze date for 26 October.",
    highlights: {
      key_decisions: [
        "Android ships first on 15 Nov; iOS follows 2 weeks post-launch",
        "Design system freeze hard-locked for 26 Oct 2026",
      ],
      blockers: ["Sana flagged need for 4 extra physical Pixel devices for telemetry testing"],
      open_questions: ["Can Meera deliver dark mode contrast variants before freeze?"],
    },
    rawFileMeta: { platform: "zoom", participants: ["Priya", "Arjun", "Meera", "Sana"] },
    createdAt: new Date("2026-10-19T15:30:00+05:30"),
  },
  {
    id: SEED_IDS.MEET_3_DESIGN_CRITIQUE,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    title: "Product Design Critique: Tactile Neumorphic System",
    meetingDate: new Date("2026-09-24T16:00:00+05:30"),
    durationMin: 40,
    captureMode: "roundtable" as const,
    status: "processed" as const,
    summary: "Meera showcased the Obsidian & Ember dual-cast shadow spec. The team approved the tactile button press mechanics and spring damping curves.",
    highlights: {
      key_decisions: ["Adopt 8px dual-offset shadow system with 1px top specular highlight"],
      blockers: [],
      open_questions: [],
    },
    rawFileMeta: { platform: "google_meet", participants: ["Meera", "Priya", "Arjun"] },
    createdAt: new Date("2026-09-24T17:00:00+05:30"),
  },
  {
    id: SEED_IDS.MEET_4_SUSTAINABILITY,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    title: "Sustainability Panel: Low-Power Mobile Telemetry",
    meetingDate: new Date("2026-09-29T11:00:00+05:30"),
    durationMin: 35,
    captureMode: "import" as const,
    status: "processed" as const,
    summary: "Evaluated battery drain across continuous voice transcription loops. Mandated local wake-word processing to cut background battery consumption by 40%.",
    highlights: {
      key_decisions: ["Throttle background sensor poll rate to 2Hz when inactive"],
      blockers: [],
      open_questions: [],
    },
    rawFileMeta: { platform: "zoom", participants: ["Arjun", "Sana"] },
    createdAt: new Date("2026-09-29T12:00:00+05:30"),
  },
  {
    id: SEED_IDS.MEET_5_ANALYTICS,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    title: "Data Analytics Review & Event Schema Finalization",
    meetingDate: new Date("2026-10-03T15:00:00+05:30"),
    durationMin: 50,
    captureMode: "roundtable" as const,
    status: "processed" as const,
    summary: "Finalized the telemetry schema for decision interactions and voice transcript error rates. Agreed on strict privacy boundaries with zero raw audio storage.",
    highlights: {
      key_decisions: ["All transcript embeddings calculated client-side or ephemeral worker"],
      blockers: [],
      open_questions: [],
    },
    rawFileMeta: { platform: "google_meet", participants: ["Priya", "Arjun", "Sana"] },
    createdAt: new Date("2026-10-03T16:00:00+05:30"),
  },
  {
    id: SEED_IDS.MEET_6_MARKETING,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    title: "Marketing Strategies Session: Creator & Beta Rollout",
    meetingDate: new Date("2026-10-08T11:30:00+05:30"),
    durationMin: 42,
    captureMode: "debrief" as const,
    status: "processed" as const,
    summary: "Rohan outlined creator seeding strategy across tech reviewers in Bangalore and Mumbai. Allocated 1,50,000 INR of the approved 4L budget for creator honorariums.",
    highlights: {
      key_decisions: ["Target 50 high-velocity product teams for private beta wave 1"],
      blockers: [],
      open_questions: [],
    },
    rawFileMeta: { platform: "google_meet", participants: ["Rohan", "Priya"] },
    createdAt: new Date("2026-10-08T12:30:00+05:30"),
  },
  {
    id: SEED_IDS.MEET_7_UX_SUMMIT,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    title: "User Experience Summit: Voice Dictation Ergonomics",
    meetingDate: new Date("2026-10-15T14:00:00+05:30"),
    durationMin: 65,
    captureMode: "roundtable" as const,
    status: "processed" as const,
    summary: "Tested user reactions to the 3D Voice Orb during extended dictation sessions. Added haptic feedback on pause and dynamic distortion scale based on speaking cadence.",
    highlights: {
      key_decisions: ["VoiceOrb3D distortion scales linearly with voice activity cadence"],
      blockers: [],
      open_questions: [],
    },
    rawFileMeta: { platform: "zoom", participants: ["Meera", "Priya", "Arjun"] },
    createdAt: new Date("2026-10-15T15:30:00+05:30"),
  },
  {
    id: SEED_IDS.MEET_8_TECH_WORKSHOP,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    title: "Tech Innovations Workshop: pgvector Hybrid Indexing",
    meetingDate: new Date("2026-10-22T17:00:00+05:30"),
    durationMin: 48,
    captureMode: "import" as const,
    status: "conflict" as const,
    summary: "Engineers debated index strategies for cross-meeting memory. CONFLICT FLAGGED: A proposal was voiced to postpone the Android release to 1 December to accommodate full offline vector re-indexing.",
    highlights: {
      key_decisions: [],
      blockers: ["Proposal to postpone Android release contradicts locked 15 Nov date"],
      open_questions: ["Can HNSW index build happen asynchronously in the background?"],
    },
    rawFileMeta: { platform: "google_meet", participants: ["Arjun", "Priya", "Sana"] },
    createdAt: new Date("2026-10-22T18:00:00+05:30"),
  },
  {
    id: SEED_IDS.MEET_9_QUARTERLY_REVIEW,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    title: "Quarterly Review: Q4 Operational Readiness",
    meetingDate: new Date("2026-10-27T10:00:00+05:30"),
    durationMin: 55,
    captureMode: "roundtable" as const,
    status: "needs_review" as const,
    summary: "Executive review of all Q4 deliverables. Three critical pending items staged for Priya's approval: push notification vendor selection, load testing authorization, and localization scope.",
    highlights: {
      key_decisions: [],
      blockers: ["Pending approval gate on push notification provider and load test budget"],
      open_questions: ["Will localization include Japanese for initial enterprise partners?"],
    },
    rawFileMeta: { platform: "google_meet", participants: ["Priya", "Arjun", "Meera", "Rohan", "Sana"] },
    createdAt: new Date("2026-10-27T11:15:00+05:30"),
  },
];

// ── Realistic Speaker Turns for Meeting 1 & Meeting 2 ───────
export const seedUtterances = [
  // Meeting 1: 8 speaker turns
  {
    id: "utt_m1_01",
    meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
    speakerId: SEED_IDS.PERSON_PRIYA,
    speakerNameRaw: "Priya Nair",
    seq: 1,
    tStart: 0,
    rawText: "Alright team, we need an unequivocal date for Mobile v2. Our board review is in mid-November and marketing needs a definitive target.",
    cleanText: "Alright team, we need an unequivocal date for Mobile v2. Our board review is in mid-November and marketing needs a definitive target.",
    corrections: [],
    isDigression: false,
  },
  {
    id: "utt_m1_02",
    meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
    speakerId: SEED_IDS.PERSON_ARJUN,
    speakerNameRaw: "Arjun Rao",
    seq: 2,
    tStart: 42,
    rawText: "From engineering, if design freezes by late October, November 15th gives us the two-week release candidate buffer we need.",
    cleanText: "From engineering, if design freezes by late October, November 15th gives us the two-week release candidate buffer we need.",
    corrections: [],
    isDigression: false,
  },
  {
    id: "utt_m1_03",
    meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
    speakerId: SEED_IDS.PERSON_PRIYA,
    speakerNameRaw: "Priya Nair",
    seq: 3,
    tStart: 88,
    rawText: "Let's lock that in then: public launch date is officially November 15th, 2026. No slips without an executive escalation.",
    cleanText: "Let's lock that in: public launch date is officially November 15th, 2026. No slips without an executive escalation.",
    corrections: [],
    isDigression: false,
  },
  {
    id: "utt_m1_04",
    meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
    speakerId: SEED_IDS.PERSON_ROHAN,
    speakerNameRaw: "Rohan Gupta",
    seq: 4,
    tStart: 135,
    rawText: "On the budget side, I ran numbers for creator seeding and paid acquisition. We need at least four lakhs to make a meaningful dent.",
    cleanText: "On budget, creator seeding and acquisition numbers indicate we need four lakhs (4,00,000 INR) to make a meaningful impact.",
    corrections: [],
    isDigression: false,
  },
  {
    id: "utt_m1_05",
    meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
    speakerId: SEED_IDS.PERSON_PRIYA,
    speakerNameRaw: "Priya Nair",
    seq: 5,
    tStart: 180,
    rawText: "Four lakh INR is approved. That is our hard ceiling for the launch envelope. Rohan, you own the entire campaign end-to-end.",
    cleanText: "Four lakh INR is approved as our hard ceiling. Rohan, you own the entire launch campaign end-to-end.",
    corrections: [],
    isDigression: false,
  },
  {
    id: "utt_m1_06",
    meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
    speakerId: SEED_IDS.PERSON_ROHAN,
    speakerNameRaw: "Rohan Gupta",
    seq: 6,
    tStart: 215,
    rawText: "Accepted. I will write and distribute the complete campaign brief to everyone by October 20th.",
    cleanText: "Accepted. I will deliver the comprehensive campaign brief to the team by October 20th.",
    corrections: [],
    isDigression: false,
  },
  {
    id: "utt_m1_07",
    meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
    speakerId: SEED_IDS.PERSON_SANA,
    speakerNameRaw: "Sana Khan",
    seq: 7,
    tStart: 255,
    rawText: "Arjun, when exactly does QA get the cut release candidate branch so we can begin the full regression cycle?",
    cleanText: "Arjun, when does QA receive the release candidate branch to begin full regression testing?",
    corrections: [],
    isDigression: false,
  },
  {
    id: "utt_m1_08",
    meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
    speakerId: SEED_IDS.PERSON_ARJUN,
    speakerNameRaw: "Arjun Rao",
    seq: 8,
    tStart: 290,
    rawText: "I will cut the release branch on November 1st sharp. That leaves 14 full days for regression and staged rollout prep.",
    cleanText: "I commit to cutting the release branch on November 1st sharp, providing 14 full days for QA regression.",
    corrections: [],
    isDigression: false,
  },

  // Meeting 2: 8 speaker turns
  {
    id: "utt_m2_01",
    meetingId: SEED_IDS.MEET_2_SCOPE_REVIEW,
    speakerId: SEED_IDS.PERSON_PRIYA,
    speakerNameRaw: "Priya Nair",
    seq: 1,
    tStart: 0,
    rawText: "Today is about platform scope and design freeze. Arjun, walk us through the platform telemetry findings.",
    cleanText: "Today we finalize platform scope and design freeze. Arjun, please share the platform telemetry findings.",
    corrections: [],
    isDigression: false,
  },
  {
    id: "utt_m2_02",
    meetingId: SEED_IDS.MEET_2_SCOPE_REVIEW,
    speakerId: SEED_IDS.PERSON_ARJUN,
    speakerNameRaw: "Arjun Rao",
    seq: 2,
    tStart: 35,
    rawText: "Android is completely stabilized. The Wispr Flow voice integration benchmarked at 99.2% accuracy. iOS still has minor Metal shader jank on older devices.",
    cleanText: "Android is fully stabilized with 99.2% voice dictation accuracy. iOS still exhibits minor Metal shader jank on older devices.",
    corrections: [],
    isDigression: false,
  },
  {
    id: "utt_m2_03",
    meetingId: SEED_IDS.MEET_2_SCOPE_REVIEW,
    speakerId: SEED_IDS.PERSON_PRIYA,
    speakerNameRaw: "Priya Nair",
    seq: 3,
    tStart: 75,
    rawText: "So what is the recommendation? Do we delay everything or stage the rollout?",
    cleanText: "What is your recommendation? Do we delay both platforms or execute a staged rollout?",
    corrections: [],
    isDigression: false,
  },
  {
    id: "utt_m2_04",
    meetingId: SEED_IDS.MEET_2_SCOPE_REVIEW,
    speakerId: SEED_IDS.PERSON_ARJUN,
    speakerNameRaw: "Arjun Rao",
    seq: 4,
    tStart: 105,
    rawText: "Android ships first on November 15th as planned. iOS follows exactly two weeks post-launch once the shader pipeline is patched.",
    cleanText: "Android ships first on November 15th as planned; iOS follows two weeks post-launch once shaders are patched.",
    corrections: [],
    isDigression: false,
  },
  {
    id: "utt_m2_05",
    meetingId: SEED_IDS.MEET_2_SCOPE_REVIEW,
    speakerId: SEED_IDS.PERSON_PRIYA,
    speakerNameRaw: "Priya Nair",
    seq: 5,
    tStart: 140,
    rawText: "Confirmed decision: Android ships first on 15 Nov; iOS follows two weeks later. Now Meera, what is the design timeline?",
    cleanText: "Confirmed: Android ships first on November 15th; iOS follows two weeks later. Meera, what is the design system timeline?",
    corrections: [],
    isDigression: false,
  },
  {
    id: "utt_m2_06",
    meetingId: SEED_IDS.MEET_2_SCOPE_REVIEW,
    speakerId: SEED_IDS.PERSON_MEERA,
    speakerNameRaw: "Meera Shah",
    seq: 6,
    tStart: 175,
    rawText: "Design system freeze is locked for October 26th. I will export the final production Figma specs by October 28th.",
    cleanText: "Design system freeze is locked for October 26th. I will deliver final production Figma specs by October 28th.",
    corrections: [],
    isDigression: false,
  },
  {
    id: "utt_m2_07",
    meetingId: SEED_IDS.MEET_2_SCOPE_REVIEW,
    speakerId: SEED_IDS.PERSON_SANA,
    speakerNameRaw: "Sana Khan",
    seq: 7,
    tStart: 215,
    rawText: "With design frozen on the 26th, QA will finalize and lock our regression test plan by October 30th.",
    cleanText: "With design frozen on October 26th, QA will finalize and lock the regression test plan by October 30th.",
    corrections: [],
    isDigression: false,
  },
  {
    id: "utt_m2_08",
    meetingId: SEED_IDS.MEET_2_SCOPE_REVIEW,
    speakerId: SEED_IDS.PERSON_PRIYA,
    speakerNameRaw: "Priya Nair",
    seq: 8,
    tStart: 250,
    rawText: "Excellent alignment. Design freeze October 26th is officially confirmed and logged to our memory.",
    cleanText: "Excellent alignment. Design freeze for October 26th is officially confirmed and stored in memory.",
    corrections: [],
    isDigression: false,
  },
];

// ── Decisions ───────────────────────────────────────────────
export const seedDecisions = [
  {
    id: SEED_IDS.DEC_LAUNCH_DATE,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
    topic: "launch-date" as const,
    statement: "Public launch date is set for 15 November 2026.",
    rationale: "Approved unanimously by product, engineering, and marketing to align with Q4 enterprise procurement cycles.",
    status: "active" as const,
    ownerId: SEED_IDS.PERSON_PRIYA,
    effectiveDate: new Date("2026-11-15T00:00:00+05:30"),
    supersedesId: null,
    evidenceUtteranceIds: ["utt_m1_02", "utt_m1_03"],
    confidence: 0.98,
    embedding: null,
    createdAt: new Date("2026-10-12T11:00:00+05:30"),
  },
  {
    id: SEED_IDS.DEC_MARKETING_BUDGET,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
    topic: "budget" as const,
    statement: "Marketing launch budget is locked at 4,00,000 INR.",
    rationale: "Covers creator honorariums (1.5L), digital distribution (2.0L), and launch event collateral (0.5L).",
    status: "active" as const,
    ownerId: SEED_IDS.PERSON_ROHAN,
    effectiveDate: new Date("2026-10-12T00:00:00+05:30"),
    supersedesId: null,
    evidenceUtteranceIds: ["utt_m1_04", "utt_m1_05"],
    confidence: 0.99,
    embedding: null,
    createdAt: new Date("2026-10-12T11:00:00+05:30"),
  },
  {
    id: SEED_IDS.DEC_CAMPAIGN_OWNERSHIP,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
    topic: "ownership" as const,
    statement: "Rohan Gupta owns the end-to-end launch campaign.",
    rationale: "Sole accountability for messaging, creator partner deliverables, and lead acquisition metrics.",
    status: "active" as const,
    ownerId: SEED_IDS.PERSON_ROHAN,
    effectiveDate: new Date("2026-10-12T00:00:00+05:30"),
    supersedesId: null,
    evidenceUtteranceIds: ["utt_m1_05", "utt_m1_06"],
    confidence: 0.96,
    embedding: null,
    createdAt: new Date("2026-10-12T11:00:00+05:30"),
  },
  {
    id: SEED_IDS.DEC_ANDROID_FIRST,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    meetingId: SEED_IDS.MEET_2_SCOPE_REVIEW,
    topic: "platform-scope" as const,
    statement: "Android ships first on 15 Nov; iOS follows two weeks post-launch.",
    rationale: "Android client passed 99.2% dictation accuracy; iOS requires shader optimization to prevent older hardware jank.",
    status: "active" as const,
    ownerId: SEED_IDS.PERSON_ARJUN,
    effectiveDate: new Date("2026-11-15T00:00:00+05:30"),
    supersedesId: null,
    evidenceUtteranceIds: ["utt_m2_04", "utt_m2_05"],
    confidence: 0.97,
    embedding: null,
    createdAt: new Date("2026-10-19T15:30:00+05:30"),
  },
  {
    id: SEED_IDS.DEC_DESIGN_FREEZE,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    meetingId: SEED_IDS.MEET_2_SCOPE_REVIEW,
    topic: "design" as const,
    statement: "Design system freeze is locked for 26 Oct 2026.",
    rationale: "Hard freeze necessary to grant engineering two full sprints of uninterrupted component implementation.",
    status: "active" as const,
    ownerId: SEED_IDS.PERSON_MEERA,
    effectiveDate: new Date("2026-10-26T00:00:00+05:30"),
    supersedesId: null,
    evidenceUtteranceIds: ["utt_m2_06", "utt_m2_08"],
    confidence: 0.98,
    embedding: null,
    createdAt: new Date("2026-10-19T15:30:00+05:30"),
  },

  // Proposed Conflict Decision (voiced in Workshop, contradicting active decision)
  {
    id: SEED_IDS.DEC_CONFLICT_PROPOSED,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    meetingId: SEED_IDS.MEET_8_TECH_WORKSHOP,
    topic: "launch-date" as const,
    statement: "Postpone Android public launch date to 1 December 2026.",
    rationale: "Proposed during Tech Workshop to allow offline HNSW vector re-indexing before public release.",
    status: "proposed" as const,
    ownerId: SEED_IDS.PERSON_ARJUN,
    effectiveDate: new Date("2026-12-01T00:00:00+05:30"),
    supersedesId: SEED_IDS.DEC_LAUNCH_DATE,
    evidenceUtteranceIds: [],
    confidence: 0.82,
    embedding: null,
    createdAt: new Date("2026-10-22T18:00:00+05:30"),
  },

  // Pending Approval Item 1
  {
    id: SEED_IDS.PENDING_DEC_NOTIFICATION_VENDOR,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    meetingId: SEED_IDS.MEET_9_QUARTERLY_REVIEW,
    topic: "platform-scope" as const,
    statement: "Adopt OneSignal Enterprise as push notification delivery infrastructure.",
    rationale: "Evaluated Firebase vs OneSignal; OneSignal offers 99.98% delivery rate within India regional carriers.",
    status: "proposed" as const,
    ownerId: SEED_IDS.PERSON_ARJUN,
    effectiveDate: new Date("2026-11-05T00:00:00+05:30"),
    supersedesId: null,
    evidenceUtteranceIds: [],
    confidence: 0.91,
    embedding: null,
    createdAt: new Date("2026-10-27T11:15:00+05:30"),
  },
];

// ── Action Items ────────────────────────────────────────────
export const seedActionItems = [
  // Completed item 1
  {
    id: SEED_IDS.ACTION_ROHAN_CAMPAIGN_BRIEF,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
    decisionId: SEED_IDS.DEC_CAMPAIGN_OWNERSHIP,
    title: "Deliver launch campaign brief to team",
    description: "Detailed creator tiering, budget breakdown, and launch week press release embargo guidelines.",
    ownerId: SEED_IDS.PERSON_ROHAN,
    ownerNameRaw: "Rohan Gupta",
    deadlineText: "by 20 Oct",
    dueDate: new Date("2026-10-20T18:00:00+05:30"),
    priority: "high" as const,
    status: "completed" as const,
    needsInput: false,
    needsInputReason: null,
    suggestedFix: null,
    updatesActionId: null,
    evidenceUtteranceIds: ["utt_m1_06"],
    confidence: 0.99,
    externalRef: { provider: "internal", card_id: "card_rohan_brief" },
    idempotencyKey: "idem_rohan_campaign_brief_001",
  },

  // CRITICAL: Due within 24 hours of sim_now (sim_now is 31 Oct 12:43; due 1 Nov 12:00)
  {
    id: SEED_IDS.ACTION_ARJUN_RELEASE_BRANCH,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
    decisionId: SEED_IDS.DEC_LAUNCH_DATE,
    title: "Arjun Rao: Cut release branch for v2.0-rc1",
    description: "Branch cut from main, freeze dependency manifest, tag v2.0-rc1, and trigger automated CI build matrix for QA handoff.",
    ownerId: SEED_IDS.PERSON_ARJUN,
    ownerNameRaw: "Arjun Rao",
    deadlineText: "1 Nov (Due in 23h)",
    dueDate: new Date("2026-11-01T12:00:00+05:30"), // Due in 23h 17m from sim_now!
    priority: "critical" as const,
    status: "approved" as const, // Approved and active!
    needsInput: false,
    needsInputReason: null,
    suggestedFix: null,
    updatesActionId: null,
    evidenceUtteranceIds: ["utt_m1_08"],
    confidence: 0.98,
    externalRef: { provider: "internal", card_id: "card_arjun_release" },
    idempotencyKey: "idem_arjun_release_branch_001",
  },

  // Completed item 2
  {
    id: SEED_IDS.ACTION_MEERA_FIGMA,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    meetingId: SEED_IDS.MEET_2_SCOPE_REVIEW,
    decisionId: SEED_IDS.DEC_DESIGN_FREEZE,
    title: "Deliver final production Figma screens",
    description: "Redlines, asset exports for Android MD3, and Neumorphic tactile button state specifications.",
    ownerId: SEED_IDS.PERSON_MEERA,
    ownerNameRaw: "Meera Shah",
    deadlineText: "by 28 Oct",
    dueDate: new Date("2026-10-28T18:00:00+05:30"),
    priority: "high" as const,
    status: "completed" as const,
    needsInput: false,
    needsInputReason: null,
    suggestedFix: null,
    updatesActionId: null,
    evidenceUtteranceIds: ["utt_m2_06"],
    confidence: 0.97,
    externalRef: { provider: "internal", card_id: "card_meera_figma" },
    idempotencyKey: "idem_meera_figma_001",
  },

  // Completed item 3
  {
    id: SEED_IDS.ACTION_SANA_TEST_PLAN,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    meetingId: SEED_IDS.MEET_2_SCOPE_REVIEW,
    decisionId: SEED_IDS.DEC_DESIGN_FREEZE,
    title: "Finalize QA regression test matrix",
    description: "42 test scenarios covering Wispr Flow dictation, offline fallback, and push token refresh.",
    ownerId: SEED_IDS.PERSON_SANA,
    ownerNameRaw: "Sana Khan",
    deadlineText: "by 30 Oct",
    dueDate: new Date("2026-10-30T18:00:00+05:30"),
    priority: "high" as const,
    status: "completed" as const,
    needsInput: false,
    needsInputReason: null,
    suggestedFix: null,
    updatesActionId: null,
    evidenceUtteranceIds: ["utt_m2_07"],
    confidence: 0.96,
    externalRef: { provider: "internal", card_id: "card_sana_test_plan" },
    idempotencyKey: "idem_sana_test_plan_001",
  },

  // Pending Approval Batch Item 2
  {
    id: SEED_IDS.PENDING_ACT_LOAD_TESTING,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    meetingId: SEED_IDS.MEET_9_QUARTERLY_REVIEW,
    decisionId: null,
    title: "Authorize load testing on sync infrastructure (10k concurrent streams)",
    description: "Requires spinning up 4 distributed Locust nodes for 48 hours to stress test WebSocket memory pipelines.",
    ownerId: SEED_IDS.PERSON_ARJUN,
    ownerNameRaw: "Arjun Rao",
    deadlineText: "by 4 Nov",
    dueDate: new Date("2026-11-04T18:00:00+05:30"),
    priority: "high" as const,
    status: "proposed" as const,
    needsInput: true,
    needsInputReason: "Requires approval for 25,000 INR cloud staging credit allocation",
    suggestedFix: "Sign off on staging budget envelope in Review Gate",
    updatesActionId: null,
    evidenceUtteranceIds: [],
    confidence: 0.89,
    externalRef: null,
    idempotencyKey: "idem_pending_load_testing_001",
  },

  // Pending Approval Batch Item 3
  {
    id: SEED_IDS.PENDING_ACT_LOCALIZATION,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    meetingId: SEED_IDS.MEET_9_QUARTERLY_REVIEW,
    decisionId: null,
    title: "Approve Hindi and Japanese locale strings for initial v2 release",
    description: "Localization team translated 240 UI keys; sign-off needed to merge into release candidate branch.",
    ownerId: SEED_IDS.PERSON_MEERA,
    ownerNameRaw: "Meera Shah",
    deadlineText: "by 5 Nov",
    dueDate: new Date("2026-11-05T18:00:00+05:30"),
    priority: "medium" as const,
    status: "proposed" as const,
    needsInput: true,
    needsInputReason: "Priya must confirm whether Japanese launch is simultaneous or v2.1",
    suggestedFix: "Approve Hindi strings for v2.0; defer Japanese to v2.1",
    updatesActionId: null,
    evidenceUtteranceIds: [],
    confidence: 0.86,
    externalRef: null,
    idempotencyKey: "idem_pending_localization_001",
  },
];

// ── Open Conflict Preview ───────────────────────────────────
export const seedConflicts = [
  {
    id: SEED_IDS.CONFLICT_SCHEDULE_CLASH,
    workspaceId: SEED_IDS.WORKSPACE_ID,
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    oldDecisionId: SEED_IDS.DEC_LAUNCH_DATE,
    newDecisionId: SEED_IDS.DEC_CONFLICT_PROPOSED,
    conflictType: "date" as const,
    severity: "high" as const,
    status: "open" as const,
    confidence: 0.96,
    explanation:
      "A proposal in Tech Innovations Workshop suggests postponing Android release to 1 December 2026 for offline vector re-indexing. This directly contradicts confirmed decision DEC-001 locking launch for 15 November 2026.",
    oldValue: "15 November 2026 (Confirmed in Launch Planning)",
    newValue: "1 December 2026 (Proposed in Tech Workshop)",
    oldQuote: "Public launch date is officially November 15th, 2026. No slips without executive escalation.",
    newQuote: "Postpone Android public launch date to 1 December 2026 to allow offline HNSW vector re-indexing.",
    downstreamActionIds: [SEED_IDS.ACTION_ARJUN_RELEASE_BRANCH, SEED_IDS.ACTION_ROHAN_CAMPAIGN_BRIEF],
    resolutionNote: null,
    resolvedBy: null,
    resolvedAt: null,
  },
];

// ── Integrations ────────────────────────────────────────────
export const seedIntegrations = [
  {
    id: "int_internal_northstar",
    workspaceId: SEED_IDS.WORKSPACE_ID,
    provider: "internal" as const,
    config: { board_name: "Mobile v2 Launch Kanban" },
    isActive: true,
  },
];

// ── Complete Seed Bundle ────────────────────────────────────
export const DEMO_SEED_DATA = {
  workspace: seedWorkspace,
  people: seedPeople,
  projects: seedProjects,
  meetings: seedMeetings,
  utterances: seedUtterances,
  decisions: seedDecisions,
  actionItems: seedActionItems,
  conflicts: seedConflicts,
  integrations: seedIntegrations,
  auditLogs: [] as any[],
  reminders: [] as any[],
  internalTasks: [] as any[],
  digests: [] as any[],
};

// In-memory mutable store so the application operates seamlessly with zero DB setup
let inMemoryStore = JSON.parse(JSON.stringify(DEMO_SEED_DATA));
if (inMemoryStore.workspace && typeof inMemoryStore.workspace.simNow === "string") {
  inMemoryStore.workspace.simNow = new Date(inMemoryStore.workspace.simNow);
}

export function getInMemoryStore() {
  if (inMemoryStore.workspace && typeof inMemoryStore.workspace.simNow === "string") {
    inMemoryStore.workspace.simNow = new Date(inMemoryStore.workspace.simNow);
  }
  return inMemoryStore;
}

export function resetInMemoryStore() {
  inMemoryStore = JSON.parse(JSON.stringify(DEMO_SEED_DATA));
  if (inMemoryStore.workspace && typeof inMemoryStore.workspace.simNow === "string") {
    inMemoryStore.workspace.simNow = new Date(inMemoryStore.workspace.simNow);
  }
  return inMemoryStore;
}
