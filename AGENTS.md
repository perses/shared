# AI contributor guide

## Purpose and instruction scope

This repository contains the versioned, publishable TypeScript libraries shared by the Perses application and plugin
ecosystem. Treat exported symbols and observable behavior as public API. Preserve package layering so consumers can use
the libraries without pulling product-specific concerns into reusable code.

Before editing:

- Read `CONTRIBUTING.md` for DCO and pull-request conventions.
- Read `README.md` and the affected package's `README.md` and public `src/index.ts` entry point.
- For TypeScript or React work, also follow `STYLEGUIDE.md`.

## Architecture map

- `client/`: framework-neutral HTTP clients, API models, and data-access helpers.
- `components/`: low-level reusable React components, hooks, themes, and visualization utilities.
- `plugin-system/`: plugin APIs, runtime registration, module federation, and plugin-facing UI contracts.
- `dashboards/`: reusable dashboard UI components and logic.
- `explore/`: explorer UI components and logic.
- `scripts/`: local development, publishing, and cross-repository linking utilities.
- `dist/` and `node_modules/` are generated or downloaded outputs. Do not edit or commit them.

Keep dependencies moving toward lower layers: `explore` can use `dashboards`; both can use `plugin-system`,
`components`, `client`, and `spec`. Lower layers must not import higher-level features. Product-specific routes,
authentication, and administration belong in the main `perses` repository; official plugin implementations belong in
`perses/plugins`.

## Engineering rules

- Use package public entry points and preserve intentional barrel exports. Do not deep-import another package's
  internals.
- Avoid dependency cycles. Put abstractions in the lowest layer that can own them without importing a consumer.
- Treat exported types, components, hooks, functions, CSS behavior, and persisted data handling as
  compatibility-sensitive.
- Add API documentation and focused tests for new public behavior. Avoid exporting implementation details speculatively.
- Keep reusable components application-agnostic and composable. Consumers should own routing and application-level
  state.
- All packages are versioned together. Do not change package versions or dependency ranges unless explicitly requested.
- Never hand-edit build output. New source files need the repository's Apache license header.
- Do not raise lint warning ceilings or add broad suppressions. New code must not add Oxlint warnings.

## Validation

Use Node.js from `.nvmrc` and pnpm 12 from `package.json`. While iterating, start with the affected workspace:

```sh
pnpm install --frozen-lockfile
pnpm --filter <workspace> lint
pnpm --filter <workspace> type-check
pnpm --filter <workspace> test
```

Before completion, run the relevant repository checks:

```sh
pnpm lint
pnpm format:check
pnpm type-check
pnpm test
pnpm build
make checklicense
```

Run CUE checks when schema-facing models or generated contracts change. The linking scripts are for local integration
with sibling Perses repositories; linked builds are not valid release artifacts, so restore normal dependencies before
final validation.

## Completion checklist

- The change respects package ownership, dependency direction, and public entry points.
- Compatibility impact on the application, plugins, and public consumers has been considered.
- Public behavior and important failures have focused test coverage and documentation where needed.
- Relevant lint, format, type, test, build, schema, and license checks pass.
- The final diff contains no build output, linked dependency state, credentials, warning-ceiling increases, or unrelated
  edits.
