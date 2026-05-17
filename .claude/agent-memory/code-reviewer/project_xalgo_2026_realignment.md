---
name: project-xalgo-2026-realignment
description: Context for the May 2026 weight/signal refactor that aligned this analyzer to the xai-org x-algorithm repo
metadata:
  type: project
---

The May 2026 refactor (commits b13f77d → 0bffb44) restructured this analyzer around the xai-org/x-algorithm 2026 model (Phoenix ranker, Grox PTOS safety, banger predictor). Key invariants the team enforces:

- 2023 numeric weights kept ONLY as `LEGACY_2023_WEIGHTS` map and `legacy_2023_weight` per-action field; `current_weight` is `null` for all actions because xai-org no longer publishes constants.
- `replied_and_engaged_by_author` (the old 75.0 / 150x signal) must NOT appear in any user-facing output. It can stay in `LEGACY_2023_WEIGHTS` as an archive guard (asserted in `test/run.js`) but must not be rendered.
- Banger predictor (`src/analyzers/banger-predictor.js`) is pure local heuristic, threshold 0.4, no API calls.
- Safety analyzer (`src/analyzers/safety-analyzer.js`) iterates 7 Grox PTOS categories from `GROX_SAFETY_CATEGORIES`.
- `src/index.js` was NOT updated in this refactor and still re-exports removed names (`ENGAGEMENT_WEIGHTS`, `SCALE_FACTORS`) — importing it throws.

**Why:** the realignment was a design-first effort, approved before implementation. Future reviews should treat upstream alignment as load-bearing.

**How to apply:** when reviewing changes touching `algorithm-weights.js`, analyzers, or the report renderer, verify (a) no fabricated upstream constants, (b) no leakage of removed signals into user-facing strings, (c) `src/index.js` re-exports actually exist.
