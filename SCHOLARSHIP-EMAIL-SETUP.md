# Scholarship email updates

This project stays on GitHub. Email subscribers and the email automation belong in the private work Google Shared Drive named **Scholarships 2026-27**.

## What is already ready

- The public site keeps no subscriber addresses.
- GitHub Actions checks the official source for every published scholarship each night.
- The notification bridge only reports newly confirmed scholarships or changes to already confirmed scholarship records.
- Planning-only scholarships do not trigger a confirmed-update email.
- The bridge is disabled until the private Google settings are added.

## One-time work-account setup

1. In `03 Email Updates - Private`, create a private Google Sheet named `Scholarship Email Updates`.
2. Open **Extensions → Apps Script** and paste `scripts/scholarship-updates.gs` from this repository.
3. Run `setupTabs()` once. Approve the requested Google permissions using the work account.
4. In Apps Script **Project Settings → Script properties**, add:
   - `SUBSCRIBER_SHEET_ID`: the ID from the private Sheet URL
   - `WEBHOOK_TOKEN`: a long random value that is not used anywhere else
5. Deploy the script as a web app. Set it to execute as you and use the most restrictive access setting that still allows GitHub Actions to reach it. Your district administrator may need to approve external web-app access.
6. In the GitHub repository, add these Actions secrets under **Settings → Secrets and variables → Actions**:
   - `SCHOLARSHIP_UPDATES_WEBHOOK`: the Apps Script web-app URL
   - `SCHOLARSHIP_UPDATES_TOKEN`: the exact same value as `WEBHOOK_TOKEN`
7. Create a Google Form for opt-in subscriptions. Use questions named `Email address`, `Name (optional)`, `What would you like to do?`, and `I agree to receive confirmed scholarship updates.` The action choices should be `Subscribe to scholarship updates` and `Unsubscribe from scholarship updates`. Link its responses to the private Sheet.
8. Return to Apps Script, select `setupFormTrigger`, and run it once. This copies consenting form responses into the private `Subscribers` tab.
9. Add the Form URL to the public finder only after the district approves the form's sharing and data-retention settings.

## Subscriber sheet rules

The `Subscribers` tab uses these headers:

`Email | Name | OptedIn | Unsubscribed | AddedAt | LastSentAt`

The `Sent Updates` tab uses these headers:

`UpdateId | SentAt | ScholarshipName`

Only the email-update administrator and approved reviewers should access this folder. Never put subscriber addresses, student details, or Google credentials in the public GitHub repository.
