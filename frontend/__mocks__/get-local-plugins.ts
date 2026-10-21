/**
 * Stub for the `get-local-plugins` virtual module (see rspack.config.ts).
 *
 * Jest cannot resolve rspack virtual modules, so the `../get-local-plugins`
 * request from public/plugins.ts is mapped to this file via `moduleNameMapper`.
 * The actual module content is generated at transform time by
 * `scripts/jest-transform-local-plugins.js`, so the contents of this file are
 * never executed.
 *
 * NOTE: The virtual module's name must stay distinct from real module names
 * (e.g. the codegen module `codegen/local-plugins.ts`) — moduleNameMapper
 * matches request strings before resolution, so a name collision would
 * silently hijack the real module's imports. The transform entry in
 * jest.config.ts must also match this file's path; if that wiring breaks, this
 * stub's empty export is what tests will see (e.g. the perspectives
 * extension-check fails with "expected 1 default perspective, received 0").
 */
export default [];
