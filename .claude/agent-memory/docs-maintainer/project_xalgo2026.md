---
name: project-xalgo2026-alignment
description: x-post-analyzer realigned to xai-org/x-algorithm 2026 upstream; key doc changes and invariants to maintain
metadata:
  type: project
---

Codebase was realigned to `github.com/xai-org/x-algorithm` (2026) across three commits (a41124c, 01abe19, 0bffb44).

**Key invariants going forward:**
- `replied_and_engaged_by_author = 75.0` must only appear in `LEGACY_2023_WEIGHTS` (CLAUDE.md legacy table) and any explicit historical-reference sections. Never in priority guidance or tips as a current weight.
- Text quality optimal range is 75–200 chars (3–8s dwell window), not 100–250.
- Negative feedback is now 4 separate heads: `not_interested`, `block_author`, `mute_author`, `report`. Do not collapse to "-74 to -369" range notation in docs.
- Numeric weights for 2026 actions are unpublished; always present them as "unpublished (legacy: X*)" with asterisk note.
- `--low-follower` CLI flag exists and must be documented.

**Current analyzer set (8 total):**
text-analyzer, reply-strategy-analyzer, slop-detector (reframed as "Negative-feedback risk (Grox)"), media-analyzer, engagement-predictor, timing-analyzer, banger-predictor (threshold ≥ 0.4), safety-analyzer (7 PTOS categories).

**Why:** xai-org upstream no longer publishes numeric weights and restructured engagement heads.

**How to apply:** When updating docs, always check that new analyzer output fields, CLI flags, and weight tables are reflected. Verify LEGACY section is clearly marked historical. Do not invent numeric weights for 2026 actions.
