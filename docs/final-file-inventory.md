# Inventaire fichier par fichier

Entrées Git suivies/non ignorées ; dépendances, builds et secrets ignorés exclus. Inventaire/statique automatisé, distinct de la revue humaine et des tests.

Frontend : 389 fichiers ; backend : 136. Chaque fichier est lu intégralement par ce script. Les binaires sont identifiés par empreinte ; leur contenu ne fait pas l’objet d’une revue de code. Les outils .agents ne sont pas des fonctionnalités VORTEX.

Le statut ci-dessous indique le contrôle applicable, pas une certification individuelle de production. Les défauts détaillés sont dans final-project-audit.md.

| Dépôt | Fichier | Lignes | Contrôle |
| --- | --- | ---: | --- |
| backend | `.env.example` | 76 | configuration, script ou asset |
| backend | `.env.supabase.example` | 45 | configuration, script ou asset |
| backend | `.gitignore` | 50 | configuration, script ou asset |
| backend | `.oxlintrc.json` | 11 | configuration, script ou asset |
| backend | `.prettierrc` | 5 | configuration, script ou asset |
| backend | `AGENTS.md` | 13 | document lu, promesses à confronter au runtime |
| backend | `README.md` | 42 | document lu, promesses à confronter au runtime |
| backend | `config/frontend.env.example` | 4 | configuration, script ou asset |
| backend | `database/security/001_roles_and_helpers.sql` | 239 | SQL évalué dans PostgreSQL isolé |
| backend | `database/security/002_business_rls.sql` | 293 | SQL évalué dans PostgreSQL isolé |
| backend | `database/security/003_storage_registry.sql` | 121 | SQL évalué dans PostgreSQL isolé |
| backend | `database/security/004_supabase_storage.sql` | 66 | SQL évalué dans PostgreSQL isolé |
| backend | `database/security/005_audit.sql` | 36 | SQL évalué dans PostgreSQL isolé |
| backend | `database/security/006_auth_runtime.sql` | 17 | SQL évalué dans PostgreSQL isolé |
| backend | `database/security/007_supabase_backend.sql` | 62 | SQL évalué dans PostgreSQL isolé |
| backend | `database/security/008_supabase_runtime_role.sql` | 11 | SQL évalué dans PostgreSQL isolé |
| backend | `database/security/009_signed_storage.sql` | 14 | SQL évalué dans PostgreSQL isolé |
| backend | `database/security/install-postgresql.psql` | 7 | SQL évalué dans PostgreSQL isolé |
| backend | `database/security/install-supabase.psql` | 8 | SQL évalué dans PostgreSQL isolé |
| backend | `docs/authentication-implementation-plan.md` | 808 | document lu, promesses à confronter au runtime |
| backend | `docs/authentication-implementation-report.md` | 299 | document lu, promesses à confronter au runtime |
| backend | `docs/backend-implementation-report.md` | 521 | document lu, promesses à confronter au runtime |
| backend | `docs/backend-stack-plan.md` | 443 | document lu, promesses à confronter au runtime |
| backend | `docs/business-implementation-report.md` | 63 | document lu, promesses à confronter au runtime |
| backend | `docs/database-architecture.md` | 258 | document lu, promesses à confronter au runtime |
| backend | `docs/rls-storage-plan.md` | 451 | document lu, promesses à confronter au runtime |
| backend | `docs/supabase-auth-audit.md` | 628 | document lu, promesses à confronter au runtime |
| backend | `docs/supabase-auth-backend-phase1-report.md` | 128 | document lu, promesses à confronter au runtime |
| backend | `docs/supabase-auth-final-report.md` | 108 | document lu, promesses à confronter au runtime |
| backend | `docs/supabase-deployment-guide.md` | 214 | document lu, promesses à confronter au runtime |
| backend | `nest-cli.json` | 9 | configuration, script ou asset |
| backend | `package.json` | 78 | configuration, script ou asset |
| backend | `pnpm-lock.yaml` | 5236 | configuration, script ou asset |
| backend | `pnpm-workspace.yaml` | 14 | configuration, script ou asset |
| backend | `prisma.config.ts` | 11 | configuration, script ou asset |
| backend | `prisma/migrations/20261002010000_initial_architecture/migration.sql` | 1472 | SQL évalué dans PostgreSQL isolé |
| backend | `prisma/migrations/20261002010100_domain_constraints/migration.sql` | 161 | SQL évalué dans PostgreSQL isolé |
| backend | `prisma/migrations/20261002010200_serialized_sales/migration.sql` | 17 | SQL évalué dans PostgreSQL isolé |
| backend | `prisma/migrations/20261004010000_better_auth_identity/migration.sql` | 70 | SQL évalué dans PostgreSQL isolé |
| backend | `prisma/migrations/20261004010100_identity_outbox/migration.sql` | 61 | SQL évalué dans PostgreSQL isolé |
| backend | `prisma/migrations/20261004010200_team_invitation_bridge/migration.sql` | 66 | SQL évalué dans PostgreSQL isolé |
| backend | `prisma/migrations/20261005010000_supabase_onboarding/migration.sql` | 37 | SQL évalué dans PostgreSQL isolé |
| backend | `prisma/migrations/20261005010100_team_invitation_resend/migration.sql` | 20 | SQL évalué dans PostgreSQL isolé |
| backend | `prisma/migrations/20261006010000_business_operations/migration.sql` | 10 | SQL évalué dans PostgreSQL isolé |
| backend | `prisma/migrations/20261006010100_fiscal_delivery/migration.sql` | 13 | SQL évalué dans PostgreSQL isolé |
| backend | `prisma/migrations/migration_lock.toml` | 2 | SQL évalué dans PostgreSQL isolé |
| backend | `prisma/schema.prisma` | 1155 | configuration, script ou asset |
| backend | `scripts/audit-project.mjs` | 48 | configuration, script ou asset |
| backend | `scripts/check-database.mjs` | 499 | configuration, script ou asset |
| backend | `scripts/check-rls.mjs` | 821 | configuration, script ou asset |
| backend | `scripts/run-isolated-tests.mjs` | 77 | configuration, script ou asset |
| backend | `src/app.controller.spec.ts` | 23 | source/tests, compilation ou recette associée |
| backend | `src/app.controller.ts` | 13 | source/tests, compilation ou recette associée |
| backend | `src/app.module.ts` | 69 | source/tests, compilation ou recette associée |
| backend | `src/app.service.ts` | 9 | source/tests, compilation ou recette associée |
| backend | `src/auth/auth-engine.ts` | 224 | source/tests, compilation ou recette associée |
| backend | `src/auth/auth.controller.ts` | 271 | source/tests, compilation ou recette associée |
| backend | `src/auth/auth.guards.ts` | 110 | source/tests, compilation ou recette associée |
| backend | `src/auth/auth.module.ts` | 41 | source/tests, compilation ou recette associée |
| backend | `src/auth/auth.schemas.ts` | 80 | source/tests, compilation ou recette associée |
| backend | `src/auth/auth.service.ts` | 144 | source/tests, compilation ou recette associée |
| backend | `src/auth/authorization.service.ts` | 155 | source/tests, compilation ou recette associée |
| backend | `src/auth/invitation-core.ts` | 80 | source/tests, compilation ou recette associée |
| backend | `src/auth/invitations.service.ts` | 83 | source/tests, compilation ou recette associée |
| backend | `src/auth/permissions.ts` | 76 | source/tests, compilation ou recette associée |
| backend | `src/auth/session.controller.ts` | 13 | source/tests, compilation ou recette associée |
| backend | `src/auth/supabase-auth.spec.ts` | 297 | source/tests, compilation ou recette associée |
| backend | `src/auth/supabase-business.controller.ts` | 64 | source/tests, compilation ou recette associée |
| backend | `src/auth/supabase-business.service.ts` | 242 | source/tests, compilation ou recette associée |
| backend | `src/auth/supabase-session.service.ts` | 47 | source/tests, compilation ou recette associée |
| backend | `src/auth/supabase-token.service.ts` | 122 | source/tests, compilation ou recette associée |
| backend | `src/auth/workspace-bootstrap.ts` | 50 | source/tests, compilation ou recette associée |
| backend | `src/auth/workspace.controller.ts` | 626 | source/tests, compilation ou recette associée |
| backend | `src/business/administration.service.ts` | 335 | source/tests, compilation ou recette associée |
| backend | `src/business/business.controller.ts` | 69 | source/tests, compilation ou recette associée |
| backend | `src/business/business.schemas.ts` | 404 | source/tests, compilation ou recette associée |
| backend | `src/business/business.service.ts` | 148 | source/tests, compilation ou recette associée |
| backend | `src/business/contracts.spec.ts` | 43 | source/tests, compilation ou recette associée |
| backend | `src/business/finance.service.ts` | 489 | source/tests, compilation ou recette associée |
| backend | `src/business/ledger.ts` | 207 | source/tests, compilation ou recette associée |
| backend | `src/business/money.spec.ts` | 66 | source/tests, compilation ou recette associée |
| backend | `src/business/money.ts` | 44 | source/tests, compilation ou recette associée |
| backend | `src/business/permissions.ts` | 35 | source/tests, compilation ou recette associée |
| backend | `src/business/purchases.service.ts` | 115 | source/tests, compilation ou recette associée |
| backend | `src/business/reporting.ts` | 139 | source/tests, compilation ou recette associée |
| backend | `src/business/sales.service.ts` | 701 | source/tests, compilation ou recette associée |
| backend | `src/business/stock.service.ts` | 511 | source/tests, compilation ou recette associée |
| backend | `src/commands/command.schemas.ts` | 83 | source/tests, compilation ou recette associée |
| backend | `src/commands/commands.controller.ts` | 35 | source/tests, compilation ou recette associée |
| backend | `src/commands/commands.module.ts` | 30 | source/tests, compilation ou recette associée |
| backend | `src/commands/commands.service.ts` | 201 | source/tests, compilation ou recette associée |
| backend | `src/common/configure-http.ts` | 132 | source/tests, compilation ou recette associée |
| backend | `src/common/http-error.filter.ts` | 52 | source/tests, compilation ou recette associée |
| backend | `src/common/public.ts` | 6 | source/tests, compilation ou recette associée |
| backend | `src/common/telemetry.controller.ts` | 27 | source/tests, compilation ou recette associée |
| backend | `src/common/zod-validation.pipe.ts` | 20 | source/tests, compilation ou recette associée |
| backend | `src/config/configured-environment.ts` | 20 | source/tests, compilation ou recette associée |
| backend | `src/config/environment.spec.ts` | 109 | source/tests, compilation ou recette associée |
| backend | `src/config/environment.ts` | 194 | source/tests, compilation ou recette associée |
| backend | `src/database/business-context.service.ts` | 39 | source/tests, compilation ou recette associée |
| backend | `src/database/database.module.ts` | 11 | source/tests, compilation ou recette associée |
| backend | `src/database/identity-database.service.ts` | 42 | source/tests, compilation ou recette associée |
| backend | `src/database/prisma.service.ts` | 36 | source/tests, compilation ou recette associée |
| backend | `src/documents/documents.controller.ts` | 80 | source/tests, compilation ou recette associée |
| backend | `src/documents/documents.module.ts` | 12 | source/tests, compilation ou recette associée |
| backend | `src/documents/documents.service.ts` | 285 | source/tests, compilation ou recette associée |
| backend | `src/documents/documents.spec.ts` | 198 | source/tests, compilation ou recette associée |
| backend | `src/fiscal/fiscal.controller.ts` | 35 | source/tests, compilation ou recette associée |
| backend | `src/fiscal/fiscal.module.ts` | 13 | source/tests, compilation ou recette associée |
| backend | `src/fiscal/fiscal.service.ts` | 306 | source/tests, compilation ou recette associée |
| backend | `src/fiscal/fiscal.spec.ts` | 188 | source/tests, compilation ou recette associée |
| backend | `src/health/health.controller.ts` | 27 | source/tests, compilation ou recette associée |
| backend | `src/main.ts` | 26 | source/tests, compilation ou recette associée |
| backend | `src/notifications/outbox-worker.spec.ts` | 32 | source/tests, compilation ou recette associée |
| backend | `src/notifications/outbox-worker.ts` | 149 | source/tests, compilation ou recette associée |
| backend | `src/notifications/outbox.ts` | 90 | source/tests, compilation ou recette associée |
| backend | `src/team/team.service.ts` | 168 | source/tests, compilation ou recette associée |
| backend | `test/app.e2e-spec.ts` | 73 | source/tests, compilation ou recette associée |
| backend | `test/auth-http.integration.ts` | 265 | source/tests, compilation ou recette associée |
| backend | `test/auth-rls.integration.ts` | 98 | source/tests, compilation ou recette associée |
| backend | `test/auth.integration.ts` | 347 | source/tests, compilation ou recette associée |
| backend | `test/http-test-helpers.ts` | 16 | source/tests, compilation ou recette associée |
| backend | `test/legacy-app.fixture.ts` | 55 | source/tests, compilation ou recette associée |
| backend | `test/migration-upgrade.integration.ts` | 91 | source/tests, compilation ou recette associée |
| backend | `test/outbox.integration.ts` | 122 | source/tests, compilation ou recette associée |
| backend | `test/supabase-auth.integration.ts` | 88 | source/tests, compilation ou recette associée |
| backend | `test/supabase-runtime.integration.ts` | 1888 | source/tests, compilation ou recette associée |
| backend | `test/supabase-security.integration.ts` | 148 | source/tests, compilation ou recette associée |
| backend | `test/team.integration.ts` | 98 | source/tests, compilation ou recette associée |
| backend | `test/telemetry.e2e-spec.ts` | 57 | source/tests, compilation ou recette associée |
| backend | `test/throttling.e2e-spec.ts` | 23 | source/tests, compilation ou recette associée |
| backend | `tsconfig.build.json` | 9 | configuration, script ou asset |
| backend | `tsconfig.json` | 33 | configuration, script ou asset |
| backend | `vitest.config.e2e.ts` | 10 | configuration, script ou asset |
| backend | `vitest.config.integration.ts` | 11 | configuration, script ou asset |
| backend | `vitest.config.ts` | 10 | configuration, script ou asset |
| frontend | `.agents/skills/README.md` | 10 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/SKILL.md` | 82 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/agents/impeccable_asset_producer.toml` | 95 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/agents/impeccable_documenter.toml` | 28 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/agents/impeccable_finish_reviewer.toml` | 41 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/agents/impeccable_manual_edit_applier.toml` | 96 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/agents/openai.yaml` | 5 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/adapt.md` | 337 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/adapt.native.md` | 60 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/android.md` | 41 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/animate.md` | 87 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/audit.md` | 147 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/audit.native.md` | 151 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/bolder.md` | 32 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/clarify.md` | 95 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/colorize.md` | 95 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/craft-floor.md` | 49 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/craft.md` | 6 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/critique.md` | 876 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/degraded/asset-producer.md` | 89 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/degraded/documenter.md` | 26 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/degraded/finish-reviewer.md` | 39 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/degraded/manual-edit-applier.md` | 119 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/delight.md` | 71 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/distill.md` | 119 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/doctor.md` | 54 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/document.md` | 456 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/extract.md` | 70 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/harden.md` | 371 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/hooks.md` | 106 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/init.md` | 136 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/ios.md` | 46 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/layout.md` | 93 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/live-setup.md` | 103 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/live.md` | 342 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/new-work.md` | 109 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/onboard.md` | 264 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/operate.md` | 62 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/optimize.md` | 281 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/overdrive.md` | 145 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/polish.md` | 98 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/quieter.md` | 106 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/routing.md` | 19 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/shape.md` | 60 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/typeset.md` | 89 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/reference/visualize.md` | 50 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/command-metadata.json` | 95 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/concept-seed.mjs` | 666 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/context-signals.mjs` | 394 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/context.mjs` | 1752 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/critique-storage.mjs` | 244 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detect-csp.mjs` | 240 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detect.mjs` | 22 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detector/browser/injected/index.mjs` | 2627 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detector/cli/main.mjs` | 512 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detector/design-system.mjs` | 1253 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detector/detect-antipatterns-browser.js` | 10721 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detector/detect-antipatterns.mjs` | 83 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detector/engines/browser/detect-url.mjs` | 524 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detector/engines/regex/detect-text.mjs` | 1571 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detector/engines/static-html/css-cascade.mjs` | 1428 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detector/engines/static-html/detect-html.mjs` | 433 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detector/engines/visual/screenshot-contrast.mjs` | 226 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detector/findings.mjs` | 28 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detector/node/file-system.mjs` | 264 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detector/profile/profiler.mjs` | 173 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detector/registry/antipatterns.mjs` | 616 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detector/rules/checks.mjs` | 7162 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detector/shared/color.mjs` | 147 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detector/shared/constants.mjs` | 198 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detector/shared/fonts.mjs` | 33 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detector/shared/inline-ignores.mjs` | 161 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/detector/shared/page.mjs` | 8 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/doctor.mjs` | 419 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/embed-prompt.mjs` | 213 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/generate-image.mjs` | 297 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/hook-admin.mjs` | 993 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/hook-before-edit.mjs` | 653 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/hook-lib.mjs` | 2566 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/hook.mjs` | 87 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/lib/artifact-schema.mjs` | 97 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/lib/composition-catalog.mjs` | 303 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/lib/concept-catalog.mjs` | 533 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/lib/design-parser.mjs` | 982 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/lib/impeccable-config.mjs` | 770 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/lib/impeccable-paths.mjs` | 178 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/lib/is-generated.mjs` | 76 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/lib/provider.mjs` | 6 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/lib/roll-selection.mjs` | 430 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/lib/staleness-deep.mjs` | 573 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/lib/staleness-notice.mjs` | 189 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/lib/staleness.mjs` | 572 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/lib/surface-briefs.mjs` | 230 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/lib/target-args.mjs` | 49 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/lib/target-slug.mjs` | 40 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/lib/template-extensions.mjs` | 162 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live-accept.mjs` | 1136 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live-browser-dom.js` | 162 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live-browser-session.js` | 146 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live-browser.js` | 15344 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live-commit-manual-edits.mjs` | 1554 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live-complete.mjs` | 175 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live-copy-edit-agent.mjs` | 848 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live-discard-manual-edits.mjs` | 56 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live-inject.mjs` | 607 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live-insert.mjs` | 377 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live-manual-edit-evidence.mjs` | 468 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live-poll.mjs` | 534 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live-resume.mjs` | 171 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live-server.mjs` | 2027 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live-status.mjs` | 89 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live-target.mjs` | 33 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live-wrap.mjs` | 1147 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live.mjs` | 443 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/accept-css.mjs` | 702 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/accept-verify.mjs` | 91 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/browser-script-parts.mjs` | 73 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/completion.mjs` | 38 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/event-validation.mjs` | 276 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/frameworks/astro.mjs` | 55 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/frameworks/detect-utils.mjs` | 77 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/frameworks/index.mjs` | 151 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/frameworks/journal.mjs` | 224 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/frameworks/nextjs.mjs` | 66 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/frameworks/nuxt.mjs` | 184 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/frameworks/script-src.mjs` | 18 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/frameworks/static-html.mjs` | 27 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/frameworks/sveltekit.mjs` | 72 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/frameworks/tag-strategy.mjs` | 287 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/frameworks/tanstack-start.mjs` | 71 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/frameworks/vite-generic.mjs` | 48 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/generation-preflight.mjs` | 164 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/insert-ui.mjs` | 524 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/instructions.mjs` | 162 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/manual-apply.mjs` | 1201 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/manual-edit-routes.mjs` | 483 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/manual-edits-buffer.mjs` | 170 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/poll-lanes.mjs` | 34 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/roots.mjs` | 627 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/session-store.mjs` | 655 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/source-lock.mjs` | 132 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/source-search.mjs` | 141 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/svelte-ast.mjs` | 1234 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/svelte-component.mjs` | 1691 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/sveltekit-adapter.mjs` | 350 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/tanstack-adapter.mjs` | 299 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/ui-core.mjs` | 217 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/live/vocabulary.mjs` | 224 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/modern-screenshot.umd.js` | 1604 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/palette.mjs` | 1152 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/pin.mjs` | 270 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/serve-question.mjs` | 1176 | outil agent hors runtime |
| frontend | `.agents/skills/impeccable/scripts/surface-brief.mjs` | 106 | outil agent hors runtime |
| frontend | `.agents/skills/responsive-interface-guardian/SKILL.md` | 101 | outil agent hors runtime |
| frontend | `.agents/skills/responsive-interface-guardian/evals/evals.json` | 32 | outil agent hors runtime |
| frontend | `.agents/skills/responsive-interface-guardian/references/dynamic-media-and-navigation.md` | 42 | outil agent hors runtime |
| frontend | `.agents/skills/responsive-interface-guardian/references/layout-strategy.md` | 81 | outil agent hors runtime |
| frontend | `.agents/skills/responsive-interface-guardian/references/next-tailwind-shadcn.md` | 38 | outil agent hors runtime |
| frontend | `.agents/skills/responsive-interface-guardian/references/validation-matrix.md` | 89 | outil agent hors runtime |
| frontend | `.agents/skills/responsive-interface-guardian/scripts/audit-viewports.mjs` | 238 | outil agent hors runtime |
| frontend | `.agents/skills/responsive-interface-guardian/scripts/viewports.json` | 37 | outil agent hors runtime |
| frontend | `.agents/skills/shadcn/SKILL.md` | 278 | outil agent hors runtime |
| frontend | `.agents/skills/shadcn/agents/openai.yml` | 6 | outil agent hors runtime |
| frontend | `.agents/skills/shadcn/assets/shadcn-small.png` | binaire | outil agent hors runtime |
| frontend | `.agents/skills/shadcn/assets/shadcn.png` | binaire | outil agent hors runtime |
| frontend | `.agents/skills/shadcn/cli.md` | 291 | outil agent hors runtime |
| frontend | `.agents/skills/shadcn/customization.md` | 210 | outil agent hors runtime |
| frontend | `.agents/skills/shadcn/evals/evals.json` | 78 | outil agent hors runtime |
| frontend | `.agents/skills/shadcn/mcp.md` | 106 | outil agent hors runtime |
| frontend | `.agents/skills/shadcn/registry.md` | 278 | outil agent hors runtime |
| frontend | `.agents/skills/shadcn/rules/base-vs-radix.md` | 311 | outil agent hors runtime |
| frontend | `.agents/skills/shadcn/rules/chat.md` | 225 | outil agent hors runtime |
| frontend | `.agents/skills/shadcn/rules/composition.md` | 216 | outil agent hors runtime |
| frontend | `.agents/skills/shadcn/rules/forms.md` | 199 | outil agent hors runtime |
| frontend | `.agents/skills/shadcn/rules/icons.md` | 102 | outil agent hors runtime |
| frontend | `.agents/skills/shadcn/rules/styling.md` | 187 | outil agent hors runtime |
| frontend | `.env.example` | 10 | configuration, script ou asset |
| frontend | `.env.frontend.example` | 13 | configuration, script ou asset |
| frontend | `.gitignore` | 34 | configuration, script ou asset |
| frontend | `AGENTS.md` | 10 | document lu, promesses à confronter au runtime |
| frontend | `CLAUDE.md` | 2 | document lu, promesses à confronter au runtime |
| frontend | `DESIGN.md` | 26 | document lu, promesses à confronter au runtime |
| frontend | `PRODUCT.md` | 26 | document lu, promesses à confronter au runtime |
| frontend | `RAPPORT_AMELIORATIONS_UX.md` | 97 | document lu, promesses à confronter au runtime |
| frontend | `RAPPORT_REALISATION_FRONTEND.md` | 284 | document lu, promesses à confronter au runtime |
| frontend | `README.md` | 65 | document lu, promesses à confronter au runtime |
| frontend | `components.json` | 22 | configuration, script ou asset |
| frontend | `docs/FINAL_STABILIZATION.md` | 133 | document lu, promesses à confronter au runtime |
| frontend | `docs/archives/frontend-avant-ameliorations-ux.tar.gz` | binaire | historique, non utilisé par le runtime |
| frontend | `docs/archives/frontend-avant-cahier.tar.gz` | binaire | historique, non utilisé par le runtime |
| frontend | `docs/business-implementation-report.md` | 63 | document lu, promesses à confronter au runtime |
| frontend | `docs/design-system.md` | 87 | document lu, promesses à confronter au runtime |
| frontend | `docs/frontend-api.md` | 139 | document lu, promesses à confronter au runtime |
| frontend | `docs/frontend-recette.md` | 40 | document lu, promesses à confronter au runtime |
| frontend | `docs/refonte/audit.md` | 124 | document lu, promesses à confronter au runtime |
| frontend | `docs/supabase-auth-final-report.md` | 55 | document lu, promesses à confronter au runtime |
| frontend | `docs/supabase-auth-frontend-implementation-report.md` | 116 | document lu, promesses à confronter au runtime |
| frontend | `docs/supabase-deployment-guide.md` | 214 | document lu, promesses à confronter au runtime |
| frontend | `docs/troc_logic.md` | 61 | document lu, promesses à confronter au runtime |
| frontend | `eslint.config.mjs` | 10 | configuration, script ou asset |
| frontend | `implementation_plan.md` | 124 | document lu, promesses à confronter au runtime |
| frontend | `implementation_planstat` | 47 | document lu, promesses à confronter au runtime |
| frontend | `next-env.d.ts` | 8 | configuration, script ou asset |
| frontend | `next.config.ts` | 8 | configuration, script ou asset |
| frontend | `package.json` | 60 | configuration, script ou asset |
| frontend | `pnpm-lock.yaml` | 6713 | configuration, script ou asset |
| frontend | `pnpm-workspace.yaml` | 4 | configuration, script ou asset |
| frontend | `postcss.config.mjs` | 6 | configuration, script ou asset |
| frontend | `public/icon-192.png` | binaire | configuration, script ou asset |
| frontend | `public/icon-512.png` | binaire | configuration, script ou asset |
| frontend | `public/manifest.webmanifest` | 23 | configuration, script ou asset |
| frontend | `public/sw.js` | 5 | configuration, script ou asset |
| frontend | `scripts/test-browser-isolated.cjs` | 48 | configuration, script ou asset |
| frontend | `src/app/[...path]/page.tsx` | 2 | source/tests, compilation ou recette associée |
| frontend | `src/app/api/auth/route.ts` | 8 | source/tests, compilation ou recette associée |
| frontend | `src/app/api/v1/[...path]/route.ts` | 110 | source/tests, compilation ou recette associée |
| frontend | `src/app/auth/callback/route.ts` | 18 | source/tests, compilation ou recette associée |
| frontend | `src/app/auth/confirm/route.ts` | 17 | source/tests, compilation ou recette associée |
| frontend | `src/app/error.tsx` | 31 | source/tests, compilation ou recette associée |
| frontend | `src/app/favicon.ico` | binaire | source/tests, compilation ou recette associée |
| frontend | `src/app/finance/page.tsx` | 2 | source/tests, compilation ou recette associée |
| frontend | `src/app/forgot-password/page.tsx` | 2 | source/tests, compilation ou recette associée |
| frontend | `src/app/globals.css` | 15 | source/tests, compilation ou recette associée |
| frontend | `src/app/historique/page.tsx` | 2 | source/tests, compilation ou recette associée |
| frontend | `src/app/invite/activate/page.tsx` | 2 | source/tests, compilation ou recette associée |
| frontend | `src/app/layout.tsx` | 34 | source/tests, compilation ou recette associée |
| frontend | `src/app/loading.tsx` | 2 | source/tests, compilation ou recette associée |
| frontend | `src/app/login/actions.ts` | 5 | source/tests, compilation ou recette associée |
| frontend | `src/app/login/page.tsx` | 2 | source/tests, compilation ou recette associée |
| frontend | `src/app/onboarding/page.tsx` | 42 | source/tests, compilation ou recette associée |
| frontend | `src/app/page.tsx` | 2 | source/tests, compilation ou recette associée |
| frontend | `src/app/rachat/page.tsx` | 2 | source/tests, compilation ou recette associée |
| frontend | `src/app/reset-password/page.tsx` | 26 | source/tests, compilation ou recette associée |
| frontend | `src/app/signup/page.tsx` | 2 | source/tests, compilation ou recette associée |
| frontend | `src/app/statistiques/page.tsx` | 2 | source/tests, compilation ou recette associée |
| frontend | `src/app/stock/page.tsx` | 2 | source/tests, compilation ou recette associée |
| frontend | `src/app/troc/page.tsx` | 2 | source/tests, compilation ou recette associée |
| frontend | `src/app/ventes/page.tsx` | 2 | source/tests, compilation ou recette associée |
| frontend | `src/components/data-display/data-table.tsx` | 355 | source/tests, compilation ou recette associée |
| frontend | `src/components/data-display/date-range-filter.tsx` | 42 | source/tests, compilation ou recette associée |
| frontend | `src/components/data-display/document-link.tsx` | 12 | source/tests, compilation ou recette associée |
| frontend | `src/components/data-display/empty-state.tsx` | 35 | source/tests, compilation ou recette associée |
| frontend | `src/components/data-display/fiscal-invoice.tsx` | 24 | source/tests, compilation ou recette associée |
| frontend | `src/components/data-display/metric-card.tsx` | 91 | source/tests, compilation ou recette associée |
| frontend | `src/components/data-display/money.tsx` | 33 | source/tests, compilation ou recette associée |
| frontend | `src/components/data-display/status-badge.tsx` | 42 | source/tests, compilation ou recette associée |
| frontend | `src/components/feedback/toaster.tsx` | 23 | source/tests, compilation ou recette associée |
| frontend | `src/components/layout/app-breadcrumb.tsx` | 51 | source/tests, compilation ou recette associée |
| frontend | `src/components/layout/app-logo.tsx` | 37 | source/tests, compilation ou recette associée |
| frontend | `src/components/layout/app-sidebar.tsx` | 234 | source/tests, compilation ou recette associée |
| frontend | `src/components/layout/mobile-navigation.tsx` | 103 | source/tests, compilation ou recette associée |
| frontend | `src/components/layout/notifications-menu.tsx` | 53 | source/tests, compilation ou recette associée |
| frontend | `src/components/layout/organization-switcher.tsx` | 102 | source/tests, compilation ou recette associée |
| frontend | `src/components/layout/page-container.tsx` | 12 | source/tests, compilation ou recette associée |
| frontend | `src/components/layout/page-header.tsx` | 25 | source/tests, compilation ou recette associée |
| frontend | `src/components/layout/store-switcher.tsx` | 53 | source/tests, compilation ou recette associée |
| frontend | `src/components/layout/topbar.tsx` | 58 | source/tests, compilation ou recette associée |
| frontend | `src/components/layout/user-menu.tsx` | 83 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/alert-dialog.tsx` | 51 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/badge.tsx` | 30 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/breadcrumb.tsx` | 110 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/button.tsx` | 44 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/card.tsx` | 24 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/checkbox.tsx` | 28 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/dialog.tsx` | 65 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/drawer.tsx` | 37 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/dropdown-menu.tsx` | 41 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/form.tsx` | 169 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/index.ts` | 20 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/input.tsx` | 20 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/label.tsx` | 9 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/pagination.tsx` | 129 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/popover.tsx` | 90 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/search-input.tsx` | 28 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/select.tsx` | 84 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/sheet.tsx` | 53 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/skeleton.tsx` | 9 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/sonner.tsx` | 42 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/switch.tsx` | 25 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/table.tsx` | 22 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/tabs.tsx` | 22 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/textarea.tsx` | 19 | source/tests, compilation ou recette associée |
| frontend | `src/components/ui/tooltip.tsx` | 16 | source/tests, compilation ou recette associée |
| frontend | `src/features/accounting/accounting-page.tsx` | 130 | source/tests, compilation ou recette associée |
| frontend | `src/features/accounting/entry-detail.tsx` | 60 | source/tests, compilation ou recette associée |
| frontend | `src/features/accounting/entry-editor.tsx` | 106 | source/tests, compilation ou recette associée |
| frontend | `src/features/audit/audit-page.tsx` | 63 | source/tests, compilation ou recette associée |
| frontend | `src/features/dashboard/dashboard-attention.tsx` | 71 | source/tests, compilation ou recette associée |
| frontend | `src/features/dashboard/dashboard-period-filter.tsx` | 63 | source/tests, compilation ou recette associée |
| frontend | `src/features/dashboard/dashboard-recent-sales.tsx` | 102 | source/tests, compilation ou recette associée |
| frontend | `src/features/dashboard/dashboard-setup-checklist.tsx` | 39 | source/tests, compilation ou recette associée |
| frontend | `src/features/finance/cash-page.tsx` | 83 | source/tests, compilation ou recette associée |
| frontend | `src/features/finance/expenses-page.tsx` | 53 | source/tests, compilation ou recette associée |
| frontend | `src/features/finance/finance-record-dialog.tsx` | 76 | source/tests, compilation ou recette associée |
| frontend | `src/features/finance/payments-page.tsx` | 53 | source/tests, compilation ou recette associée |
| frontend | `src/features/pos/cart-item.tsx` | 92 | source/tests, compilation ou recette associée |
| frontend | `src/features/pos/cart.tsx` | 185 | source/tests, compilation ou recette associée |
| frontend | `src/features/pos/checkout-confirmation.tsx` | 74 | source/tests, compilation ou recette associée |
| frontend | `src/features/pos/checkout-panel.tsx` | 53 | source/tests, compilation ou recette associée |
| frontend | `src/features/pos/customer-selector.tsx` | 42 | source/tests, compilation ou recette associée |
| frontend | `src/features/pos/mobile-cart-drawer.tsx` | 53 | source/tests, compilation ou recette associée |
| frontend | `src/features/pos/payment-selector.tsx` | 124 | source/tests, compilation ou recette associée |
| frontend | `src/features/pos/product-card.tsx` | 51 | source/tests, compilation ou recette associée |
| frontend | `src/features/pos/product-filters.tsx` | 31 | source/tests, compilation ou recette associée |
| frontend | `src/features/pos/product-search.tsx` | 26 | source/tests, compilation ou recette associée |
| frontend | `src/features/pos/receipt.tsx` | 88 | source/tests, compilation ou recette associée |
| frontend | `src/features/sales/credits-page.tsx` | 47 | source/tests, compilation ou recette associée |
| frontend | `src/features/sales/refund-dialog.tsx` | 94 | source/tests, compilation ou recette associée |
| frontend | `src/features/sales/sale-details.tsx` | 87 | source/tests, compilation ou recette associée |
| frontend | `src/features/sales/sales-page.tsx` | 71 | source/tests, compilation ou recette associée |
| frontend | `src/features/sales/sales-table.tsx` | 89 | source/tests, compilation ou recette associée |
| frontend | `src/features/settings/settings-page.tsx` | 176 | source/tests, compilation ou recette associée |
| frontend | `src/features/settings/store-dialog.tsx` | 36 | source/tests, compilation ou recette associée |
| frontend | `src/features/stock/product-details.tsx` | 41 | source/tests, compilation ou recette associée |
| frontend | `src/features/stock/replenishment-page.tsx` | 43 | source/tests, compilation ou recette associée |
| frontend | `src/features/stock/stock-filters.tsx` | 25 | source/tests, compilation ou recette associée |
| frontend | `src/features/stock/stock-import-dialog.tsx` | 137 | source/tests, compilation ou recette associée |
| frontend | `src/features/stock/stock-page.tsx` | 109 | source/tests, compilation ou recette associée |
| frontend | `src/features/stock/stock-table.tsx` | 61 | source/tests, compilation ou recette associée |
| frontend | `src/features/team/team-member-dialog.tsx` | 266 | source/tests, compilation ou recette associée |
| frontend | `src/features/team/team-page.tsx` | 123 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/accounting-page.tsx` | 908 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/accounting.ts` | 209 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/analytics.tsx` | 409 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/api.ts` | 93 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/auth-flow.ts` | 38 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/auth-page.tsx` | 376 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/auth-provider.tsx` | 40 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/charts.tsx` | 130 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/dashboard.tsx` | 316 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/demo.ts` | 1507 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/forms.tsx` | 844 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/history-bootstrap.ts` | 16 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/history.ts` | 99 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/import-stock.tsx` | 214 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/navigation.ts` | 164 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/operations.ts` | 200 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/pages.tsx` | 440 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/pos.tsx` | 397 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/provider.tsx` | 453 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/returns.tsx` | 210 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/settings.tsx` | 293 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/shell.tsx` | 345 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/types.ts` | 302 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/ui.tsx` | 604 | source/tests, compilation ou recette associée |
| frontend | `src/frontend/workflows.tsx` | 221 | source/tests, compilation ou recette associée |
| frontend | `src/instrumentation-client.ts` | 4 | source/tests, compilation ou recette associée |
| frontend | `src/lib/chart-colors.ts` | 8 | source/tests, compilation ou recette associée |
| frontend | `src/lib/supabase/client.ts` | 10 | source/tests, compilation ou recette associée |
| frontend | `src/lib/supabase/config.ts` | 11 | source/tests, compilation ou recette associée |
| frontend | `src/lib/supabase/proxy.ts` | 19 | source/tests, compilation ou recette associée |
| frontend | `src/lib/supabase/redirect.ts` | 19 | source/tests, compilation ou recette associée |
| frontend | `src/lib/supabase/server.ts` | 13 | source/tests, compilation ou recette associée |
| frontend | `src/lib/utils.ts` | 7 | source/tests, compilation ou recette associée |
| frontend | `src/providers/design-system-provider.tsx` | 17 | source/tests, compilation ou recette associée |
| frontend | `src/proxy.ts` | 16 | source/tests, compilation ou recette associée |
| frontend | `src/styles/base.css` | 181 | source/tests, compilation ou recette associée |
| frontend | `src/styles/legacy/auth.css` | 222 | source/tests, compilation ou recette associée |
| frontend | `src/styles/legacy/controls.css` | 201 | source/tests, compilation ou recette associée |
| frontend | `src/styles/legacy/data.css` | 294 | source/tests, compilation ou recette associée |
| frontend | `src/styles/legacy/forms.css` | 238 | source/tests, compilation ou recette associée |
| frontend | `src/styles/legacy/navigation.css` | 140 | source/tests, compilation ou recette associée |
| frontend | `src/styles/legacy/refinements.css` | 216 | source/tests, compilation ou recette associée |
| frontend | `src/styles/legacy/responsive.css` | 248 | source/tests, compilation ou recette associée |
| frontend | `src/styles/print.css` | 82 | source/tests, compilation ou recette associée |
| frontend | `src/styles/tokens.css` | 101 | source/tests, compilation ou recette associée |
| frontend | `supabase/README.md` | 8 | historique, non utilisé par le runtime |
| frontend | `supabase/clean_data.sql` | 21 | historique, non utilisé par le runtime |
| frontend | `supabase/migration.sql` | 288 | historique, non utilisé par le runtime |
| frontend | `supabase/migration_auth.sql` | 21 | historique, non utilisé par le runtime |
| frontend | `supabase/migration_buybacks.sql` | 22 | historique, non utilisé par le runtime |
| frontend | `supabase/migration_soft_delete.sql` | 10 | historique, non utilisé par le runtime |
| frontend | `supabase/seed_brands.sql` | 22 | historique, non utilisé par le runtime |
| frontend | `supabase/structure.sql` | 82 | historique, non utilisé par le runtime |
| frontend | `tests/accounting.test.cjs` | 653 | source/tests, compilation ou recette associée |
| frontend | `tests/auth.test.cjs` | 284 | source/tests, compilation ou recette associée |
| frontend | `tests/browser-auth-fixture.cjs` | 13 | source/tests, compilation ou recette associée |
| frontend | `tests/browser-smoke.cjs` | 38 | source/tests, compilation ou recette associée |
| frontend | `tests/browser-ux.cjs` | 182 | source/tests, compilation ou recette associée |
| frontend | `tests/design-system-regressions.cjs` | 60 | source/tests, compilation ou recette associée |
| frontend | `tests/history.test.cjs` | 87 | source/tests, compilation ou recette associée |
| frontend | `tests/navigation-responsive.cjs` | 171 | source/tests, compilation ou recette associée |
| frontend | `tests/responsive-matrix.cjs` | 180 | source/tests, compilation ou recette associée |
| frontend | `tests/responsive-workflows.cjs` | 11 | source/tests, compilation ou recette associée |
| frontend | `tsconfig.json` | 42 | configuration, script ou asset |
| frontend | `vendor/README.md` | 11 | document lu, promesses à confronter au runtime |
| frontend | `vendor/xlsx-0.20.3.tgz` | binaire | configuration, script ou asset |
| frontend | `vortex_favicon_1773064553361.png` | binaire | configuration, script ou asset |
| frontend | `walkthroughstat` | 34 | document lu, promesses à confronter au runtime |

Commandes implémentées : team.invite, team.update, product.save, product.archive, stock.entry, stock.adjust, stock.transfer, stock.import, sale.create, sale.refund, sale.return, trade.create, buyback.create, purchase.create, supplier.save, client.save, payment.create, expense.create, expense.reverse, cash.open, cash.close, cash.movement, entry.save, entry.post, entry.reverse, account.save, account.toggle, period.lock, store.save, settings.save.

Commandes absentes (0) : .

Modèles Prisma non classifiés par SQL 007 : aucun.
