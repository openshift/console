# eslint-plugin-console

OpenShift Console's ESLint rules and configs.

## Usage

When extending multiple configurations, add to the list following the order outlined below:

| Config           | Description                                                                                          | Type     |
| ---------------- | ---------------------------------------------------------------------------------------------------- | -------- |
| base             | JavaScript lint rule set                                                                             | core     |
| react            | React lint rule set                                                                                  | core     |
| typescriptParser | Adds support for parsing TypeScript                                                                  | ts       |
| typescript       | Adds support for parsing TypeScript and TypeScript lint rule set (does not require typescriptParser) | ts       |
| jest             | Jest lint rule set                                                                                   | extra    |
| node             | Node lint rule set                                                                                   | extra    |

- Choose one `core`.
- Choose one `ts`.
- Choose one or more `extra`.

Alternatively, use one of the pre-composed configurations representing common code archetypes (choose one):

| Config                    | Description                 |
| ------------------------- | --------------------------- |
| react-typescript | Common web preset: React, TypeScript |
| node-typescript  | Common Node.js preset: TypeScript    |

## Examples

These configs are authored in the legacy (eslintrc) format, but are consumed
from a flat config (`eslint.config.ts`) via `FlatCompat`.

The pre-composed presets are consumed using the `compat.extends()` helper, e.g.
`compat.extends('plugin:console/react-typescript')`.

See this repo's [`eslint.config.ts`](../../eslint.config.ts) for a complete
multi-scope example.
