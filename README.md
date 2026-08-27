# Class of 2027 Next Steps

A free GitHub Pages hub for Toppenish High School advisory students.

The scholarship finder is also available as a separate, shareable page at `scholarships.html`. It uses the student-safe `data/scholarships.json` source but does not include advisory-specific pages or teacher information. The Pickaxe Coach reads that same public source so its recommendations follow the website's publishing rules.

The simplified homepage is `index.html`. `senior.html` is the fast-action Senior Essentials page for official transcript requests, senior updates, financial aid, counseling, and student access. The full original advisory hub remains available at `resources.html`. Every primary page uses the same navigation and visual shell.

The homepage is a simple routing hub rather than an AI workspace. Quick guidance opens in a small on-demand dialog, and the legacy `coach.html` address opens that dialog. `writing.html` is the full Writing Studio: students enter a prompt and their own notes, then send a story-path or rubric-based draft-check request directly to the embedded coach with one button. Word counting happens locally, and form entries are transmitted only when a student deliberately requests AI feedback.

Scholarship priorities rank opportunities instead of excluding them. Confirmed and open opportunities appear first, stronger matches rise within that group, and planning opportunities follow. Search words can still narrow the list.

## The nightly system

At about 2:15 a.m. Pacific Standard Time (3:15 a.m. during daylight saving time), GitHub Actions:

1. imports only Airtable records approved for publication and verified as available to Toppenish students, when the `AIRTABLE_TOKEN` repository secret is configured;
2. keeps the existing public list if Airtable is unavailable or not configured;
3. checks the official link for every public scholarship;
4. records when each source was checked and flags changed sources for review.

The site never changes an expected deadline into a confirmed deadline on its own. That protects students from an incorrect date. A changed official page is flagged so its exact new information can be verified and then updated in Airtable. The overnight job imports only records that staff have marked **Publish** and **Verified eligible**; it never publishes review/hold records or replaces the public list with an empty result. It also stops if the list is empty.

To add or update a scholarship, edit the Airtable record, verify the official source, and set both publishing gates correctly. Add a verified student-facing checklist to **Application requirements** when the sponsor provides one. The nightly workflow generates the public JSON only from records that pass the publishing contract.

## One-time setup

1. In GitHub repository settings, enable **Pages**: deploy from branch `main`, folder `/(root)`.
2. Run the **Nightly scholarship refresh** workflow once from the Actions tab.

No student information is collected or stored. Transcript links open the official Toppenish School District request form or district PDFs; this public site never receives the student's record information.

The standalone finder saves a student's list only in that browser. “Email my list” opens the student's own email program and does not send addresses to this site. Automatic new-scholarship email alerts require a private mailing-list service; do not add an email form or store student addresses in this public repository until that service is connected and its privacy terms are reviewed.

The finder also links to public GitHub review forms for scholarship submissions, corrections, and helpful programs or resources. These are review leads only; a person must verify and approve them before publication. Contributors are instructed not to post private student information.

## Airtable labels

- **Confirmed for 2027**: official current-cycle information.
- **Expected — last year's information**: a real recurring scholarship whose new details are not published yet. Cards show an estimated opening month/year or a recurring opening date when the sponsor publishes one.
- **Needs review**: never published to students.
- **Closed / archive**: never published to students.

## Important limit

The scholarship board is intentionally broad: a card may be Toppenish-, Yakima Valley-, Washington-, Pacific Northwest-, or nationally available when at least one Toppenish student may qualify. Students must still read the card's exact eligibility condition.

The free, no-AI workflow can verify official sources and flag changes every night. Reliable automatic discovery and eligibility judgment for five brand-new scholarships every night requires a paid research/AI service or a staff review queue. Do not automatically publish unverified scholarship search results to students.

