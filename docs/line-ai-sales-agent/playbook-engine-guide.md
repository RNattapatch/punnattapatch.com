# LINE AI Sales Agent Playbook Engine Guide

## Scope

Stage 2 provides a framework-independent engine for the later Astro interface. It owns local progress, readiness derivation, search, prompt composition, backup portability, and reset behavior. It does not render UI or make network requests.

## Entry point

```js
import { playbook } from '../../data/line-ai-sales-agent/playbook.js';
import { createPlaybookEngine } from './app.js';

const engine = createPlaybookEngine({ playbook });
```

The browser uses `localStorage` automatically. Tests or previews can inject any storage object implementing `getItem`, `setItem`, and `removeItem`.

## Engine contract

| Method | Result |
| --- | --- |
| `getState()` | Cloned local state with progress, profile, current location, notes, and saved timestamp |
| `getProgress()` | Derived step, phase, overall, milestone, and resume readiness |
| `setChecklistItem(itemId, completed)` | Persists one action item such as `P0:action-1` |
| `setBlocked(stepId, blocked)` | Marks or clears a Needs attention state |
| `confirmMilestone(phaseId, confirmed)` | Explicitly confirms a real operating result |
| `setCurrent(phaseId, stepId)` | Persists the current location for resume |
| `setShopProfile(field, value)` | Stores a non-secret shop field only |
| `setNote(noteId, value)` | Stores a non-secret learner note |
| `search(query, filters)` | Returns contextual step results with phase and status |
| `composePrompt(promptId, values)` | Returns a copy-ready prompt with safe replacements |
| `copyProgressSummary()` | Returns a shareable text summary without secrets |
| `exportCsv()` | Returns action-level progress CSV with formula-injection protection |
| `exportBackup()` | Returns a versioned JSON backup string |
| `previewImport(payload)` | Validates a backup and reports counts before writing |
| `importBackup(payload)` | Restores a validated backup and persists it |
| `reset()` | Clears all three namespaced local keys and returns empty state |

## Storage contract

The engine keeps three namespaced keys:

```text
pun:line-ai-sales-agent:v1:progress
pun:line-ai-sales-agent:v1:profile
pun:line-ai-sales-agent:v1:ui
```

The state version is `v1`. On load, unknown step IDs, action IDs, phase IDs, malformed dates, secret-shaped profile keys, and secret-shaped values are discarded. A content update keeps IDs that still exist and moves the content version forward without clearing valid learner progress.

## Readiness rules

- `not-started`: no action item is complete.
- `in-progress`: at least one action item is complete but the required actions are not ready.
- `needs-attention`: the learner explicitly marked the Step as blocked.
- `working`: all required action items are complete. A Phase becomes `working` only after the learner explicitly confirms its milestone.

Milestones are never auto-confirmed from checkbox completion. This keeps the Playbook aligned with the operating rule: readiness is evidence, not a score.

## Resume order

1. Current blocked Step
2. First blocked Step in Playbook order
3. First incomplete required Step in the current Phase
4. Unconfirmed milestone whose required actions are ready
5. First Step of the next unfinished Phase
6. Final System Review

The engine shows dependency guidance rather than hard-locking a Step. Existing systems can be ahead of the guided sequence, but the user still sees the prerequisite warning.

## Safety boundaries

The engine never accepts or persists fields whose names or values look like an API key, access token, channel secret, password, bank account, customer record, payment slip, or chat log. Prompt composition replaces a secret-shaped value with a visible redaction marker and reports the field in `redactedFields`.

Backup and summary output include only progress, safe profile fields, notes, current location, and timestamps. They do not include the shop's credentials or customer data.

## Verification

Run the complete Stage 1 + Stage 2 contract suite from the web repository root:

```bash
node --test tests/line-ai-sales-agent/*.test.mjs
```

The suite covers local persistence, state migration, readiness, milestone confirmation, resume logic, Thai/English search, filters, prompt redaction, summary/CSV/backup output, import preview, restore, reset, and the existing content safety contract.
