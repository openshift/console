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
| prettier         | Format with prettier                                                                                 | prettier |

- Choose one `core`.
- Choose one `ts`.
- Choose one or more `extra`.
- Choose to include `prettier` or not. This must go last.

Alternatively, use one of the pre-composed configurations representing common code archetypes (choose one):

| Config                    | Description                                    |
| ------------------------- | ---------------------------------------------- |
| react-typescript-prettier | Common web preset: React, TypeScript, Prettier |
| node-typescript-prettier  | Common Node.js preset: TypeScript, Prettier    |

## Examples

By default, ESLint will look for configuration files in all parent folders up to the root directory.
When using the configurations from this plugin, it's recommended too specify `"root": true` to stop this behavior.

#### Standard TypeScript React Web Development

```json
{
  "root": true,
  "extends": [
    "plugin:console/react",
    "plugin:console/typescript",
    "plugin:console/jest",
    "plugin:console/prettier"
  ]
}
```

#### Standard Node Scripting

```json
{
  "root": true,
  "extends": [
    "plugin:console/base",
    "plugin:console/node",
    "plugin:console/prettier"
  ]
}
```

#### Simple React with Jest

```json
{
  "root": true,
  "extends": [
    "plugin:console/react",
    "plugin:console/jest"
  ]
}
```

#### Simple JavaScript

```json
{
  "root": true,
  "extends": [
    "plugin:console/base"
  ]
}
```
