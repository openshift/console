# Legacy hook stubs (not Claude Code–native)

The `pre-tool-use.js` and `user-prompt-submit.js` files in this folder were written in an **ES module export** style (`export function preToolUse(...)`) that does **not** match the [Claude Code hook protocol](https://docs.anthropic.com/en/docs/claude-code/hooks) (stdin JSON → stdout JSON / exit codes).

**Enforcement used by this repository:** shell hooks under **`.claude/hooks/`**, registered in **`.claude/settings.json`**.

Keep these `.js` files only if you plan to wrap them with a small `node` loader; otherwise prefer editing the `.sh` hooks.
