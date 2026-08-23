# Class of 2027 Next Steps

A free GitHub Pages hub for Toppenish High School advisory students.

The scholarship finder is also available as a separate, shareable page at `scholarships.html`. It uses the same `data/scholarships.json` source but does not include advisory-specific pages or teacher information.

The free Next Steps Coach is available at `coach.html`. It asks a few plain-language questions and creates a private starting plan for scholarships, pathways, applications, or writing. It requires no account and stores choices only in the student's browser.

The Start Here page acts as an automatic front desk: it pulls the next verified senior date, an open scholarship matched to saved priorities, and the student's saved plan from the existing site data. No separate “today” list has to be maintained.

Scholarship priorities rank opportunities instead of excluding them. Urgent confirmed deadlines stay first, stronger matches rise within similar deadline windows, and planning opportunities remain clearly separated.

## The nightly system

At about 2:15 a.m. Pacific Standard Time (3:15 a.m. during daylight saving time), GitHub Actions:

1. locks the manually maintained roster in `data/scholarships.json` so records cannot be added, removed, or renamed;
2. checks the official link for every existing scholarship;
3. publishes an unambiguous future opening, future deadline, rolling status, or same-sponsor redirect to the matching existing card;
4. records every automatic field change and sends unclear information to the staff review note.

The updater never searches for or publishes a new scholarship. It also cannot replace the list, delete a record, or rename one. A prior-cycle or ambiguous date remains planning information until the official source shows one clear future date. If the reader finds conflicting dates, a PDF it cannot safely interpret, or a failed link, it keeps the student-facing card unchanged and adds the item to `data/review-needed.md`. The workflow stops if the roster changes shape or if too many records would change at once.

To add a scholarship, edit `data/scholarships.json` manually, verify the official source, and commit the change. New records never come from the nightly job. Existing cards can receive the limited verified updates described above; staff can still edit any record manually. Use `gpaMin` only when the sponsor clearly lists a minimum GPA; the finder uses it to explain academic fit, never to hide a student from an opportunity. Keep `needs` and `effort` current so students can see what to prepare and how much time to plan.

## One-time setup

1. In GitHub repository settings, enable **Pages**: deploy from branch `main`, folder `/(root)`.
2. Run the **Nightly scholarship refresh** workflow once from the Actions tab.

No student information is collected or stored.

The standalone finder saves a student's list only in that browser. It is not confidential on a shared Chromebook, so students should clear their choices before leaving. “Email my list” opens the student's own email program and does not send addresses to this site. Automatic new-scholarship email alerts require a private mailing-list service; subscriber addresses stay outside this public repository.

Scholarship submissions, corrections, and helpful programs or resources use one private review workflow. These are review leads only; a person must verify and approve them before publication. Contributors are instructed not to post private student information.

## Scholarship labels

- **Confirmed for 2027**: official current-cycle information.
- **Expected — last year's information**: a real recurring scholarship whose new details are not published yet. Cards show an estimated opening month/year or a recurring opening date when the sponsor publishes one.
- **Needs review**: never published to students.
- **Closed / archive**: never published to students.

## Important limit

The scholarship board is intentionally broad: a card may be Toppenish-, Yakima Valley-, Washington-, Pacific Northwest-, or nationally available when at least one Toppenish student may qualify. Students must still read the card's exact eligibility condition.

The free, no-AI workflow checks every existing official source nightly and can publish only high-confidence date, status, and same-sponsor link updates. It does not discover new scholarships or rewrite human-reviewed eligibility guidance. The nightly report in `data/review-needed.md` separates unclear pages from links that failed, while `data/automatic-updates.json` records exactly what changed.
