# Scholarship publishing rules

This is the standing contract for the Class of 2027 scholarship pipeline.

## Keep these working parts

- `data/scholarships.json` remains the public data source and keeps `updatedAt` plus `publicationRule`.
- FAFSA, WASFA, Washington College Grant, College Bound Scholarship, and Passport to Careers remain separate from scholarship records.
- `mapScholarship()` normalizes Airtable text and tags into controlled `fit` and `tags` arrays.
- Filters stay disclosure-safe: use “Show scholarships for…” language.
- The student site keeps one filter row. Do not restore a second STEM / Trades / Arts / Open-now row unless student testing shows that the extra complexity improves use.

## Safe-to-publish contract

Every public scholarship must have all six:

1. A specific deadline or explicit rolling/year-round status.
2. The deadline read on the sponsor's official page or official application document.
3. A one-sentence eligibility summary a Toppenish senior can assess quickly.
4. A working link to the sponsor's scholarship page or application.
5. Controlled-vocabulary `tags` and `fit` arrays after normalization.
6. A `lastChecked` date. Recheck records older than about 60 days before publishing again.

Recurring plan-ahead scholarships may use the prior-cycle deadline only when the sponsor's official source confirms the program and prior date. They must be labeled as prior-cycle information and warn that the next date may change.

Candidates that fail any gate remain unpublished. Never bulk-import an archive or aggregator.

## Nightly behavior

The nightly workflow may check links, detect source changes, and export approved Airtable records. It must never turn a predicted deadline into a confirmed one or publish an unreviewed candidate automatically.

## Local employer pattern

WAEF uses one application for multiple tree-fruit scholarships. The student-facing WAEF card should teach applicants to enter a parent's exact employer name. Do not create a separate public card for every employer sub-fund.

Agri Beef / Washington Beef remains an ask-HR lead until the employer confirms a current award, application link, and deadline. Do not publish an amount or date from an old employee-program document.
