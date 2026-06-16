import type { Extension, CodeRef } from '../types';

/** Forces a single perspective to be active and hides the perspective switcher. */
export type ForcePerspective = Extension<
  'console.force-perspective',
  {
    /** The perspective identifier to force. */
    perspectiveId: string;
    /** Hook that returns [shouldForce, loading]. */
    useForcePerspective: CodeRef<() => [boolean, boolean]>;
  }
>;

export const isForcePerspective = (e: Extension): e is ForcePerspective =>
  e.type === 'console.force-perspective';
