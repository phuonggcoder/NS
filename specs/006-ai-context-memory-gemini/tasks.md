# Tasks: Context-Aware Gemini AI & Long-Term Brand Memory

- [x] T001 Create Spec Kit `006-ai-context-memory-gemini` docs
- [x] T002 Implement `server-ai-memory.mjs` (`ai:memory:<projectId>`, `buildServerProjectContext`) and `src/ai/contextBuilder.ts`
- [x] T003 Upgrade `server-ai.mjs` with Gemini `systemInstruction`, `holistic_audit`, and rule distillation
- [x] T004 Wire `GET/PUT /api/ai/memory` and `POST /api/ai/feedback` in `server-api.mjs` + update `Dockerfile`
- [x] T005 Upgrade `src/ai/aiTypes.ts`, `src/ai/llmClient.ts`, `src/studio/AiAssistantPanel.tsx`, and `src/studio/StudioApp.tsx`
- [x] T006 Write `tests/ai-memory-feedback.test.mjs` and run `npm run check` & `npm test`
