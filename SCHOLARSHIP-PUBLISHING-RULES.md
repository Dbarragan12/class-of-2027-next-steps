# Scholarship publishing rules

This is the standing contract for the Class of 2027 scholarship pipeline.

## Keep these working parts

- `data/scholarships.json` remains the public data source and keeps `updatedAt` plus `publicationRule`.
- FAFSA, WASFA, Washington College Grant, College Bound Scholarship, and Passport to Careers remain separate from scholarship records.
- `mapScholarship()` normalizes the public JSON records into controlled `fit` and `tags` arrays.
- Filters stay disclosure-safe: use “Show scholarships for…” language.
- The student site keeps one filter row. Do not restore a second STEM / Trades / Arts / Open-now row unless student testing shows that the extra complexity improves use.
- The public finder lives at `scholarships.html` so it can be shared without exposing advisory-specific pages or teacher information. The advisory hub links to it; scholarship search UI belongs on the standalone page.

## Safe-to-publish contract

Every public scholarship must have all six:

1. A specific deadline or explicit rolling/year-round status.
2. The deadline read on the sponsor's official page or official application document.
3. A one-sentence eligibility summary a Toppenish senior can assess quickly.
4. A working link to the sponsor's scholarship page or application.
5. Controlled-vocabulary `tags` and `fit` arrays after normalization.
6. A `lastChecked` date. Recheck records older than about 60 days before publishing again.

Long-running expected scholarships may use 2025–26 school-year information, or the most recent official cycle available, to help students prepare before the new cycle is released. They must include a prior deadline, sponsor link, eligibility summary, controlled tags, and last-checked date. The card should show the expected opening month/year—or the recurring opening date when the sponsor publishes one—and warn that the deadline, award, eligibility rules, and even whether the program returns may change.

Geographic reach is intentionally broad: Toppenish, Yakima County/Valley, Washington, the Pacific Northwest, or national. A narrow opportunity is still publishable when at least one Toppenish student may qualify, but the card must name the qualifying condition plainly (such as a specific program, family employer, tribal affiliation, identity, or life experience). “Broad access” does not mean every student qualifies.

Candidates that fail any gate remain unpublished. Never bulk-import an archive or aggregator.

Community submissions, corrections, and program/resource leads enter the GitHub review queue through the public issue templates. They are never published automatically. Reviewers must verify the official source and remove or reject any submission containing private student information before considering publication.

## Nightly behavior

The nightly workflow checks links and detects source changes in the existing manually maintained list. It must never import Airtable, replace the list, delete manual records, turn a prior or predicted deadline into a confirmed one, or publish an unreviewed candidate automatically. Expected records remain expected until a person verifies the new cycle. If the list is empty, the workflow must fail safely instead of committing an empty file.

The public GitHub Pages site cannot securely collect email addresses or send automatic notifications by itself. Until a private mailing-list service is connected and reviewed, the finder may open a student's own email program or copy a saved list, but it must not store subscriber addresses in the repository or send unapproved messages.

## Local employer pattern

WAEF uses one application for multiple tree-fruit scholarships. The student-facing WAEF card should teach applicants to enter a parent's exact employer name. Do not create a separate public card for every employer sub-fund.

Local agriculture and employer-linked opportunities are included because orchards, vineyards, dairies, food processing, and related businesses employ many Toppenish-area parents and guardians. Never imply that all of these awards require the student to study agriculture: distinguish scholarships unlocked by family employment from scholarships that require an agriculture-, wine-, or industry-related program of study.

Agri Beef / Washington Beef remains an ask-HR lead until the employer confirms a current award, application link, and deadline. Do not publish an amount or date from an old employee-program document.
