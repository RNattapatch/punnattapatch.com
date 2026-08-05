# LINE AI Sales Agent Playbook — Content Authoring Guide

## Purpose

The content modules in `src/data/line-ai-sales-agent/` are the single source of truth for the guided playbook. Keep this layer declarative: no UI state, network calls, deployment values, credentials, or customer-identifying data.

## Module map

| Module | Responsibility |
| --- | --- |
| `shop-example.js` | The single illustrative business, บ้านโซฟา |
| `prepare.js` | P0–P9 foundation and access preparation |
| `build.js` | B1–B7 Worker and knowledge assembly |
| `sell.js` | S1–S7 LINE sales operating loop |
| `arm.js` | A1–A8 sales tools, monitoring, and daily operation |
| `prompts.js` | Eight editable master prompts and one debug prompt |
| `troubleshooting.js` | Eleven cross-system symptoms and checks |
| `playbook.js` | The composed public content object |
| `schema.js` | Content safety and reference validation |

## Step contract

Every learner step needs these fields:

```js
{
  id: 'P0',
  title: 'Short action title',
  required: true,
  sourceRefs: ['S0'],
  dependsOn: [],
  why: 'Why this work matters to a real sales operation.',
  actions: ['Concrete action one', 'Concrete action two'],
  check: 'The observable condition that means the work is ready.',
  fixes: ['First recovery action', 'Second recovery action'],
  proof: 'The artefact or result the learner can show.',
}
```

Dependencies must reference an earlier step in the full journey. A step cannot depend on itself or a later step.

## Writing rules

- Write the learner-facing content in Thai; keep code identifiers in English.
- Preserve the fixed order: PREPARE → BUILD → SELL → ARM.
- A learner must be able to complete each step through WHY → DO → CHECK → FIX → PROOF without needing an instructor.
- Use บ้านโซฟา only as an illustrative business. Do not insert a real customer’s contact details, bank details, or private commercial data.
- Public copy must not identify itself as a course, class project, certificate, or episode-based teaching material. The schema rejects the English and Thai labels that would conflict with this positioning.
- Never put credentials, access strings, passwords, or secret-shaped values into a data module, prompt template, test fixture intended for public content, screenshot, or document.

## Prompt contract

Each prompt has an `id`, `title`, `stepIds`, `editableFields`, `template`, and `safetyNote`.

- `stepIds` must point to real learner steps.
- `editableFields` describe harmless business inputs only; credentials never belong here.
- The `template` is a reusable operating instruction, not a place to paste a provider configuration.
- `safetyNote` must remind the author that credentials stay outside the prompt.

## Troubleshooting contract

Each symptom needs an `id`, learner-readable `symptom`, real `stepIds`, one or more `checks`, and `debugPromptContext`. Prefer a symptom that a learner can see over a vague technical label.

## Validation

Run the data-contract checks from the web repository root:

```bash
node --test tests/line-ai-sales-agent/schema.test.mjs tests/line-ai-sales-agent/content-contract.test.mjs
```

The tests protect the 32-step map, milestones, source coverage, prompt and troubleshooting references, backward dependencies, prohibited public labels, and secret-shaped strings.
