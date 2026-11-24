# Feature Specification: Context-Aware Gemini AI & Long-Term Brand Memory

**Feature Branch**: `006-ai-context-memory-gemini`
**Created**: 2026-11-24
**Status**: In Progress

## User Scenarios & Testing

### User Story 1 — Long-Term Brand Memory (`ai:memory:<projectId>`)
As a website owner/agency, I want the AI Assistant to remember each project's brand profile (industry, tone, target audience, USP, forbidden words), learned content rules, and optimization history in persistent KV storage, and let me inspect or edit those rules anytime.

### User Story 2 — Context-Aware Holistic Audit & Copywriting
As a designer, I want Gemini AI (configured via server `GEMINI_API_KEY`) to receive a compact summary of the entire `LandingPageSpec`, `DigitalMenuConfig`, SEO/Audit findings, 30-day Analytics, and Long-Term Brand Memory in `systemInstruction`, so it can produce Top 5 actionable site-wide optimizations and on-brand copy with 1-click Apply.

### User Story 3 — Self-Learning Feedback Loop
As a user, whenever I accept, edit-then-apply, or reject an AI suggestion, I want the system to log the decision and—when edited or rejected—automatically distill a concise (< 20 words) preference rule into `learnedRules` (capped at 20 rules) so AI improves over time.
