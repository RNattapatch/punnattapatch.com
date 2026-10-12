# Gates: punnattapatch.com production deploy

Scope: after every push to main, prove both Cloudflare Pages projects serve origin/main, private routes stay private, and the edge serves the new catalog.json

- [ ] G1: punnattapatch.com production deployment is origin/main with stage deploy/success and its rollback id is logged
  CHECK: node scripts/verify-deploy.mjs stage marketing
  EXPECT: STAGE OK punnattapatch-marketing
  EVIDENCE: pending

- [ ] G2: app.punnattapatch.com production deployment is origin/main with stage deploy/success and its rollback id is logged
  CHECK: node scripts/verify-deploy.mjs stage app
  EXPECT: STAGE OK punnattapatch-app
  EVIDENCE: pending

- [ ] G3: public site returns 200 while /app/* is 404 on marketing and app hosts redirect to Cloudflare Access
  CHECK: node scripts/verify-deploy.mjs routes
  EXPECT: ROUTES OK
  EVIDENCE: pending

- [ ] G4: catalog.json served at the edge is byte-equal to the one built from origin/main
  CHECK: node scripts/verify-deploy.mjs catalog
  EXPECT: CATALOG OK
  EVIDENCE: pending

<!--
Setup (once per machine, from the repo root):
  mkdir -p .unlazy/deploy && cp -n scripts/deploy-gates.template.md .unlazy/deploy/GATES.md
  node ~/.claude/skills/unlazy/scripts/gate-check.mjs --scope deploy --approve --timeout 600

After every push to main:
  node ~/.claude/skills/unlazy/scripts/gate-check.mjs --scope deploy --reverify --timeout 600
  tail -2 .unlazy/deploy/rollback.log     # rollback ids to quote in the report

Keep --timeout 600 identical every run: it is part of the approval, and G1/G2 poll up to
9 minutes while Cloudflare builds. Editing a CHECK/EXPECT or this ledger's path needs --approve again.
Negative controls run 2026-10-12: stage on an in-flight build (FAIL queued/active),
stage --commit <older sha> (FAIL production serves newer), catalog against an older
pricing commit (FAIL with differing package keys). See scripts/verify-deploy.mjs.
-->
