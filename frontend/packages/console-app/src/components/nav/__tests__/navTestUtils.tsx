import type { ReactElement } from 'react';
import type { PerspectiveType } from '@console/dynamic-plugin-sdk';
import { PerspectiveContext } from '@console/dynamic-plugin-sdk';
import type { ExtendedRenderOptions } from '@console/shared/src/test-utils/unit-test-utils';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

export const renderWithPerspective = (
  ui: ReactElement,
  activePerspective: PerspectiveType = 'admin',
  setActivePerspective: jest.Mock = jest.fn(),
  options?: ExtendedRenderOptions,
) =>
  renderWithProviders(
    <PerspectiveContext.Provider value={{ activePerspective, setActivePerspective }}>
      {ui}
    </PerspectiveContext.Provider>,
    options,
  );
