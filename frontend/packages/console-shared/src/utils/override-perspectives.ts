import type { AccessReviewResourceAttributes } from '@console/dynamic-plugin-sdk';

export enum PerspectiveVisibilityState {
  Enabled = 'Enabled',
  Disabled = 'Disabled',
  AccessReview = 'AccessReview',
}

export type PerspectiveAccessReview = {
  required?: AccessReviewResourceAttributes[];
  missing?: AccessReviewResourceAttributes[];
};

export type PerspectiveVisibility = {
  state: PerspectiveVisibilityState;
  accessReview?: PerspectiveAccessReview;
};

export type PerspectivePinnedResource = {
  group?: string;
  version: string;
  resource: string;
};

export type Perspective = {
  id: string;
  visibility: PerspectiveVisibility;
  pinnedResources?: PerspectivePinnedResource[];
};

/**
 * If {@link window.SERVER_FLAGS.perspectives} is defined, return the parsed array.
 *
 * Otherwise, return `undefined` (no perspective overrides specified).
 */
const getOverridePerspectives = (): Perspective[] => {
  if (window.SERVER_FLAGS.perspectives) {
    try {
      const value = JSON.parse(window.SERVER_FLAGS.perspectives);

      if (!Array.isArray(value)) {
        throw new Error('Parsed value must be an array', value);
      }

      return value as Perspective[];
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to parse perspectives override', e);
    }
  }

  return undefined;
};

// Evaluate once at runtime
export const overridePerspectives = getOverridePerspectives();
