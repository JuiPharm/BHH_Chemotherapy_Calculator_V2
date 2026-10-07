# Clinical governance notes — v2.1.0

The six pilot regimens in this release have local approval recorded per project-owner confirmation on 7 October 2026. The engine is fail-closed and the published structured records are the calculation source of truth.

## Approved pilot registry

- TCH — eviQ ID 53 reference model
- modified FOLFOX6 — eviQ ID 637 reference model
- R-CHOP21 — eviQ ID 70 reference model
- ABVD advanced stage — eviQ ID 56 reference model
- BEP metastatic testicular germ cell — eviQ ID 320 reference model
- Carboplatin + Paclitaxel ovarian — eviQ ID 252 reference model

## Change-control notes

The following items are not blockers for this approved six-regimen pilot, but must remain explicit when future versions are proposed:

- TCH: maintain the approved local trastuzumab cycle definition and Carboplatin kidney-function policy.
- mFOLFOX6: any leucovorin convention change requires a new regimen version.
- R-CHOP21: prednisone/prednisolone substitution requires an explicit local protocol change rather than silent equivalence.
- ABVD/BEP: Bleomycin remains represented in International Units and must never be silently converted to mg.
- BEP: risk-group-specific cycle count must be represented by the correct regimen/version.
- Ovarian Carboplatin/Paclitaxel: AUC5/AUC6 selection remains an explicit clinical choice.

## Rounding policy

Published rounding defaults may be edited in the Rounding Policy screen as a browser-local override. The app supports import, export, and reset. A policy intended for all users should be exported, reviewed, and then published centrally as `data/rounding-profiles.json` under version control.

## Future-regimen publication gate

New or modified regimens should continue to require: structured schema validation, source review, independent oncology-pharmacist review, golden calculation tests, version assignment, and an immutable published snapshot.
