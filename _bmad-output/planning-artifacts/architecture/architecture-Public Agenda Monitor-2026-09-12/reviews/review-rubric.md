# Rubric Review — Architecture Spine

**Verdict: Needs revision before handoff.** The spine has a clear, appropriately small modular-monolith direction and passes the mechanical lint, but it leaves several MVP-level contracts undecided. Those omissions would let independently built adapters, review screens, and the agenda disagree.

## Critical / High

1. **[High — autofix] The normalized event contract is not bound.** AD-2 requires a “shared normalized event format,” but never names the fields every adapter must provide. The brief requires the agenda to show date, optional time, event name/topic, protagonists or organizer, location, source, and direct source link. Without a mandatory/minimum normalized shape (and rules for missing optional values), adapters can return incompatible records and the agenda cannot reliably render the promised information. Add an AD or a compact convention that binds the required event fields and their nullability.

2. **[High — autofix or defer] “New since last review” has no shared meaning.** The brief makes new-event highlighting a core MVP capability, while the spine only says that it lives in the candidate view. It does not decide whether “new” means a first-seen event, an event changed by a later retrieval, or an event not yet reviewed; nor does it define the reference point in an account-free MVP. Different views could therefore flag different events. Add a rule (for example, first-seen candidates since the latest recorded team review) or explicitly defer the feature from MVP scope.

3. **[High — discuss and then autofix/defer] The feedback-to-suggestion contract is silent.** The brief says aggregated approval/rejection, comments, and score feedback must improve later relevance/priority suggestions. AD-5 says suggestions may order but never decide, and Deferred postpones a trained model, but neither decides the MVP’s non-ML feedback mechanism nor defers that requirement. Modules could each invent different scoring behavior, or omit learning entirely. Bind a transparent heuristic/update rule and its inputs, or defer this capability with an explicit MVP limitation and update the brief accordingly.

4. **[High — defer or decide] The operational/environmental envelope is incomplete.** Vercel and Supabase are named, but no decision/deferment covers environments, deployment/migration sequencing, or operational recovery/retention. This is a whole initiative-altitude dimension, not implementation detail: an adapter change or migration could break the demo or editorial history. A tiny MVP rule is sufficient—for example, one preview/demo environment, migrations applied before app deploy, and database backup/recovery owned by the managed provider—or list each as Deferred with a revisit condition.

## Medium

5. **[Medium — autofix] Ranking is not a durable shared rule.** The brief asks for a manual priority order; AD-5 binds “ranking” but does not state whether rank is global or per filtered view, how ties work, or whether rank survives retrieval. Specify a persisted manual rank independent of retrieval and a deterministic fallback order.

6. **[Medium — defer] Source-access compliance is inherited as an assumption but not carried into the spine.** The brief requires source-specific terms and technical access rules to be checked before production. Add it as an MVP constraint/deferred release condition so every adapter follows the same boundary.

## Confirmed strengths

- Every AD includes `Binds`, `Prevents`, and an actionable `Rule`; the deterministic lint reports zero findings.
- The core divergence points—one application boundary, adapter isolation, server-side mutations, stable identity, editorial approval, non-destructive failures, and demo access—are well covered.
- The declared stack is current/appropriately pinned by starter lockfile, and the scope preserves the brief’s first vertical slice and excluded crawler/queue work.

