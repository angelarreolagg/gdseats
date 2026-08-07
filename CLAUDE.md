# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

`pslscout-demo` is currently an unmodified Vite + React scaffold — `src/` holds only `main.tsx`, `App.tsx` (a placeholder "Hello world!"), and `index.css`. There is no application architecture yet, no router, no state management, no tests, and no git repository. Expect to establish these conventions rather than discover them.

## Commands

Package manager is **pnpm** (`pnpm-lock.yaml`).

```bash
pnpm dev      # Vite dev server with HMR
pnpm build    # tsc -b (typecheck, project references) then vite build
pnpm lint     # eslint .
pnpm preview  # serve the production build from dist/
```

There is no test runner configured. If tests are needed, add one (Vitest pairs with the existing Vite setup).

## Stack notes

- **React 19** with `StrictMode`; entry is `src/main.tsx` mounting into `#root` from `index.html`. The React Compiler is *not* enabled.
- **Tailwind CSS v4** via the `@tailwindcss/vite` plugin — configured entirely through `@import "tailwindcss"` in `src/index.css`. There is no `tailwind.config.js`; customize with CSS-first directives (`@theme`, `@utility`) in that file.
- **`motion`** (v13) is a dependency but unused so far — it is the intended animation library.
- **TypeScript** uses solution-style project references: `tsconfig.json` → `tsconfig.app.json` (`src/`, browser) + `tsconfig.node.json` (Vite config, node). Add new source paths to the right one. `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, and `erasableSyntaxOnly` are on, so unused bindings and non-erasable TS syntax (enums, parameter properties) break the build, and type-only imports must use `import type`.
- **ESLint** flat config (`eslint.config.js`) with `js.recommended`, `typescript-eslint` recommended (not type-aware), `react-hooks`, and `react-refresh`. Type-aware rules are documented as an opt-in upgrade in `README.md`.

The `README.md` is still the stock Vite template text and does not describe this project.
