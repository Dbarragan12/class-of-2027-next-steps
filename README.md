# Class of 2027 Next Steps

A free GitHub Pages hub for Toppenish High School advisory students.

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

## Airtable labels

- **Confirmed for 2027**: official current-cycle information.
- **Expected — last year's information**: a real recurring scholarship whose new details are not published yet.
- **Needs review**: never published to students.
- **Closed / archive**: never published to students.

## Important limit

The free, no-AI workflow can verify official sources and flag changes every night. Reliable automatic discovery and eligibility judgment for five brand-new scholarships every night requires a paid research/AI service or a staff review queue. Do not automatically publish unverified scholarship search results to students.
