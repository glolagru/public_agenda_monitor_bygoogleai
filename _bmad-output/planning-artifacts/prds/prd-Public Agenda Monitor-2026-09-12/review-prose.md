# Prose review — Public Agenda Monitor PRD

This document exists to help an internal, non-developer editorial team and MVP implementers agree on the hackathon requirements for Public Agenda Monitor. The prose uses a deliberate requirements voice: short declarative statements, stable glossary terms, and testable consequences. Preserve that approach.

| Pass | Original Text | Revised Text | Changes |
| --- | --- | --- | --- |
| prose | §1 Vision: “It provides one clearer, forward-looking working view of editorially relevant upcoming events.” | “It provides one clear, forward-looking view of upcoming events relevant to editorial planning.” | Removes the awkward “working view” construction and makes the benefit easier to scan. |
| prose | FR-1: “The product first delivers the Federal President Source as a complete vertical slice, then the Federal Constitutional Court and UN Women through the same user experience.” | “The MVP implements the Federal President Source first. It then adds the Federal Constitutional Court and UN Women using the same user experience.” | “Delivers” and “vertical slice” are implementation jargon; the revision expresses the intended rollout in plain language. |
| prose | FR-6: “The queue uses the same current event state for filtering, ranking, and display.” | “Filters, ranking, and the displayed list always use the same saved state of each event.” | Replaces the abstract phrase “current event state” with a concrete explanation. |
| prose | FR-7: “The Suggested Score follows the shared lens: plausible coverage by a respected, independent German news programme.” | “The Suggested Score is based on one shared question: Would a respected, independent German news programme plausibly cover this event?” | Turns an unexplained metaphor (“shared lens”) into the practical editorial question it represents. |
| prose | FR-13: “A failed Source displays an understandable error and the time of the failed Retrieval.” | “When a Retrieval fails, the Source Health status shows an understandable error and the time of the attempt.” | A Source cannot itself display an error; naming the status element makes the requirement less ambiguous. |
| prose | SM-1: “all three Sources produce rule-qualified Candidate Events” | “all three Sources produce Candidate Events that meet their documented qualification rules” | Expands a compressed compound phrase for the non-developer editorial audience without changing the metric. |

**Summary:** 6 prose recommendations. No structural recommendations are repeated here; the prior structure review remains the source for those changes. These edits improve plain-language comprehension without changing scope or requirements.
