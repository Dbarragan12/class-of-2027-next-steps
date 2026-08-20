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

Every confirmed public scholarship must have all six:

1. A specific deadline or explicit rolling/year-round status.
2. The deadline read on the sponsor's official page or official application document.
3. A one-sentence eligibility summary a Toppenish senior can assess quickly.
4. A working link to the sponsor's scholarship page or application.
5. Controlled-vocabulary `tags` and `fit` arrays after normalization.
6. A `lastChecked` date. Recheck records older than about 60 days before publishing again.

Recurring opportunities may appear as tentative planning cards even when there is only a small chance they return. A dated sponsor source or a dated school-hosted prior-cycle post, application, flyer, or document may establish that the opportunity existed. Each planning card must name the source cycle, include a source note or historical-source link, provide a self-assessable eligibility summary, controlled tags, and a last-checked date, and state plainly that the opening, deadline, award, requirements, and return are not guaranteed.

When a prior deadline is known, project that month and day into the 2026–27 cycle and label it **Tentative deadline — based on previous data; not guaranteed**. If the archive does not preserve a prior deadline, do not invent one. Tentative records never create calendar events. Once a person verifies a current-cycle opening and deadline from the new sponsor or school source, update the record to confirmed; the finder will automatically display **Open & accepting** and use the confirmed deadline.

Geographic reach is intentionally broad: Toppenish, Yakima County/Valley, Washington, the Pacific Northwest, or national. A narrow opportunity is still publishable when at least one Toppenish student may qualify, but the card must name the qualifying condition plainly (such as a specific program, family employer, tribal affiliation, identity, or life experience). “Broad access” does not mean every student qualifies.

Candidates that fail any gate remain unpublished. Never bulk-import an archive or aggregator.

Community submissions, corrections, and program/resource leads enter through the public Google review form and its private review dashboard. They are never published automatically. Reviewers must verify the source and remove or reject any submission containing private student information before considering publication.

## Nightly behavior

The nightly workflow checks links and detects source changes in the existing manually maintained list. A changed source is a prompt to check whether the new cycle opened. The workflow must never import Airtable, replace the list, delete manual records, turn a prior or predicted deadline into a confirmed one, or publish an unreviewed candidate automatically. Expected records remain tentative until a person verifies the new cycle and enters the current opening and deadline. The finder then changes the public label automatically. If the list is empty, the workflow must fail safely instead of committing an empty file.

The public site must never store subscriber addresses in the repository. Subscription choices and addresses belong only in the connected private Google Workspace form/sheet workflow. Public scholarship cards may open a student's own email program, copy a saved list, or download confirmed deadlines to a personal calendar.

## Local employer pattern

WAEF uses one application for multiple tree-fruit scholarships. The student-facing WAEF card should teach applicants to enter a parent's exact employer name. Do not create a separate public card for every employer sub-fund.

Local agriculture and employer-linked opportunities are included because orchards, vineyards, dairies, food processing, and related businesses employ many Toppenish-area parents and guardians. Never imply that all of these awards require the student to study agriculture: distinguish scholarships unlocked by family employment from scholarships that require an agriculture-, wine-, or industry-related program of study.

Agri Beef / Washington Beef remains an ask-HR lead until the employer confirms a current award, application link, and deadline. Do not publish an amount or date from an old employee-program document.
