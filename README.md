# Mod Queue Command Center

Mod Queue Command Center is a Devvit web app for Reddit moderators. It brings reported, spammed, and modqueue items into one review workspace, adds AI-assisted triage, and keeps the moderator in control of the final action.

## Why Moderators Use It

- Review queue items with context, reports, and user history in one place.
- Ask Gemini for a structured moderation signal without auto-enforcing it.
- Approve, remove, or escalate items from the same workspace.
- Track app-level decisions, repeated rule matches, and resolved work.
- Fall back safely when AI is disabled or unavailable.

## MVP Features

- Real queue loading from modqueue, reports, and spam sources.
- Deduped queue items across sources.
- Gemini classification with local fallback.
- Classification states: not analyzed, analyzing, available, fallback, failed, and disabled.
- Moderator-friendly metadata such as "Analyzed just now", "Last analyzed X ago", and "Fallback analysis shown".
- Manual Analyze and explicit Reanalyze behavior.
- Auto classification support when `classificationMode` is `auto_on_load`.
- Approve and Remove actions applied to Reddit.
- Escalate and workflow status tracking in Redis.
- Resolved items hidden by default unless settings say otherwise.
- Queue filters for active, all, resolved, escalated, and high-risk items.
- Queue sorting by priority, report count, or newest.
- In-app moderator settings for AI enablement, manual/auto classification, resolved visibility, AI reasoning visibility, and second-opinion threshold.
- Decision records with moderator, timestamp, selected rule, note, AI feedback, and AI snapshot.
- User history for app-tracked approvals, removals, escalations, repeated rule matches, and last action.

## Architecture

- Devvit app config: `devvit.json`
- Client web view: `src/client`
- Hono server: `src/server`
- Shared domain types/defaults: `src/shared`
- Reddit runtime APIs: `@devvit/web/server`
- Redis persistence: `@devvit/redis`
- Gemini HTTP API: `generativelanguage.googleapis.com`

The server exposes API routes under `/api` for queue, classification, decisions, and settings. Redis stores classifications, decisions, statuses, user history, and subreddit-level app settings.

## Devvit Setup

Use Node 20+.

```bash
npm install
npm run build
npx devvit upload
```

The Devvit app identity currently remains:

```text
modqueueccsmoke2
```

## Local Playtest

Create a local `.env` file at the project root:

```bash
GEMINI_API_KEY=your_gemini_key_here
```

Local `.env` values are read during playtesting only.

Run:

```bash
npx devvit playtest modqueuecc_dev
```

Open the subreddit mod menu and click **Open Mod Queue Command Center**.

## Production Gemini Secret

Production Devvit hosting does not read your local `.env`. Store the Gemini key as an encrypted Devvit secret:

```bash
npx devvit settings list
npx devvit settings set geminiApiKey
```

The app reads `GEMINI_API_KEY` first for local playtest, then falls back to the Devvit secret `geminiApiKey`.

## Gemini Missing Or Invalid

If Gemini is missing, invalid, blocked, or returns malformed output, the app falls back to the local heuristic classifier. Moderators will see fallback metadata instead of a hard failure, and they can still approve, remove, or escalate manually.

If AI is disabled in settings, Analyze/Reanalyze is disabled and classification requests are rejected server-side.

## Testing Approve, Remove, And Escalate

1. Create or report a test post/comment in `modqueuecc_dev`.
2. Open the Command Center.
3. Confirm the item appears in the queue.
4. Click **Analyze with AI** or **Reanalyze with AI**.
5. Use **Approve**, **Remove**, or **Escalate**.
6. Refresh the queue and confirm the decision and user history persisted.
7. Use the resolved filter/toggle to confirm resolved items are hidden by default.

## MVP QA Checklist

Queue loading:

- A reported post appears.
- A reported comment appears.
- A spammed post appears.
- A spammed comment appears.
- A modqueue item appears.
- The same item from multiple Reddit sources appears only once.
- Empty queue shows a useful empty state.
- Refresh reloads queue data without changing selected settings.

Queue controls:

- Active filter hides resolved items.
- All filter shows active and resolved items.
- Resolved filter shows only resolved items.
- Escalated filter shows second-opinion items.
- High-risk filter shows high-risk active items.
- Priority sort orders by triage score.
- Reports sort prioritizes items with more report reasons.
- Newest sort prioritizes newest queue items.
- Resolved toggle works from empty and populated states.

AI classification:

- Manual mode does not classify until Analyze is clicked.
- Auto mode classifies not-yet-analyzed items on queue load.
- Analyze creates a visible AI signal.
- Reanalyze updates the analysis timestamp.
- Gemini result shows provider/model metadata quietly.
- Missing Gemini key falls back safely.
- Invalid Gemini key fails calmly and shows fallback analysis.
- Fallback analysis is labeled as fallback.
- AI disabled disables Analyze/Reanalyze and prevents server-side classification.
- AI reasoning expands/collapses according to `showAiSummaryByDefault`.

Moderation actions:

- Approve applies to Reddit.
- Remove applies to Reddit.
- Escalate updates local workflow status.
- Decision persists after refresh.
- Escalation persists after refresh.
- Resolved item hides from active queue after decision.
- AI feedback value is saved with the decision.
- Moderator note is saved with the decision.
- Selected rule and AI snapshot are saved with the decision.

User history:

- App-tracked approvals increment.
- App-tracked removals increment.
- App-tracked escalations increment.
- Repeated rule matches are shown.
- Last app-tracked action is shown.
- User history persists after refresh.

Settings:

- AI analysis toggle saves and updates UI behavior.
- Classification mode saves and affects manual/auto behavior.
- Show resolved by default saves and affects the next queue load.
- Expand AI reasoning saves and affects the AI panel.
- Second-opinion threshold saves without validation errors for values 0-100.

Secrets and environments:

- Production `geminiApiKey` secret works in Devvit runtime.
- Local `.env` `GEMINI_API_KEY` works in playtest.
- Local `.env` is ignored by git.
- Diagnostics are hidden from the public mod menu.

## Demo Flow

1. Start from a subreddit with at least one reported or spammed item.
2. Open **Open Mod Queue Command Center** from Mod Tools.
3. Show the active queue and select a high-priority item.
4. Run Gemini analysis.
5. Point out risk, confidence, suggested action, possible rule match, reasoning, and second-opinion suggestion.
6. Add optional moderator feedback/note.
7. Approve, remove, or escalate.
8. Refresh and show persistence, resolved filtering, and user history.

## Known Limitations

- The app tracks user history only for actions taken through this app.
- Gemini output is advisory and must be reviewed by a moderator.
- The local fallback classifier is heuristic and intentionally conservative.
- Diagnostics remain as server endpoints but are not exposed in the public mod menu.
- Settings save immediately; there is not yet a separate audit trail for setting changes.
