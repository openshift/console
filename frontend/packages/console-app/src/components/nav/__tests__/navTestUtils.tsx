import type { ReactElement } from 'react';
import type { PerspectiveType } from '@console/dynamic-plugin-sdk';
import { PerspectiveContext } from '@console/dynamic-plugin-sdk';
import { ForcedPerspectiveContext } from '@console/shared/src/hooks/forcedPerspectiveContext';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

export const renderWithPerspective = (
  ui: ReactElement,
  activePerspective: PerspectiveType = 'admin',
  setActivePerspective: jest.Mock = jest.fn(),
) =>
  renderWithProviders(
    <ForcedPerspectiveContext.Provider value={{ loaded: true, perspectiveId: null }}>
      <PerspectiveContext.Provider value={{ activePerspective, setActivePerspective }}>
        {ui}
      </PerspectiveContext.Provider>
    </ForcedPerspectiveContext.Provider>,
  );
