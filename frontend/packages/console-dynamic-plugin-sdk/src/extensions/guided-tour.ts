/* eslint-disable @typescript-eslint/naming-convention */

import type { TourDataType } from '@console/app/src/components/tour';
import type { Extension, CodeRef } from '@console/dynamic-plugin-sdk/src/types';

// This extension is not part of the console dynamic plugin SDK public API.
// It is intended for internal use only. Please do not use it. Pretty please?

// Reasons:
// 1. The `tour` CodeRef is structured for static plugins. i18n support is not good.
// 2. We are investigating removal of the guided tour entirely.
// 3. We do not guarantee the stability of the extension properties and type.

/** @hidden */
export type INTERNAL_DO_NOT_USE_GuidedTour = Extension<
  'INTERNAL_DO_NOT_USE.guided-tour',
  {
    perspective: string;
    tour: CodeRef<TourDataType>;
  }
>;

/** @hidden */
export const INTERNAL_DO_NOT_USE_isGuidedTour = (
  e: Extension,
): e is INTERNAL_DO_NOT_USE_GuidedTour => {
  return e.type === 'INTERNAL_DO_NOT_USE.guided-tour';
};
