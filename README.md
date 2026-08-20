# Class of 2027 Next Steps

A free GitHub Pages hub for Toppenish High School advisory students.

The scholarship finder is also available as a separate, shareable page at `scholarships.html`. It uses the same `data/scholarships.json` source but does not include advisory-specific pages or teacher information.

The free Next Steps Coach is available at `coach.html`. It asks a few plain-language questions and creates a private starting plan for scholarships, pathways, applications, or writing. It requires no account and stores choices only in the student's browser.

The Start Here page acts as an automatic front desk: it pulls the next verified senior date, an open scholarship matched to saved priorities, and the student's saved plan from the existing site data. No separate “today” list has to be maintained.

Scholarship priorities rank opportunities instead of excluding them. Urgent confirmed deadlines stay first, stronger matches rise within similar deadline windows, and planning opportunities remain clearly separated.

## The nightly system

At about 2:15 a.m. Pacific Standard Time (3:15 a.m. during daylight saving time), GitHub Actions:

1. keeps the manually maintained records in `data/scholarships.json`;
2. checks the official link for every scholarship;
3. records when each source was checked and flags changed sources for review.

The site never changes an expected deadline into a confirmed deadline on its own. That protects students from an incorrect date. A changed official page is flagged so its exact new information can be verified and then updated manually. The overnight job never imports Airtable, deletes manual records, or publishes a new scholarship automatically. It also stops if the list is empty.

To add or update a scholarship, edit `data/scholarships.json` manually, verify the official source, and commit the change. The nightly check will preserve it and update its `lastChecked` date when the official page responds.

## One-time setup

1. In GitHub repository settings, enable **Pages**: deploy from branch `main`, folder `/(root)`.
2. Run the **Nightly scholarship refresh** workflow once from the Actions tab.

No student information is collected or stored.

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
