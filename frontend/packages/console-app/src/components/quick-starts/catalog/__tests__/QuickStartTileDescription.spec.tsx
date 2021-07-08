import * as React from 'react';
import { Popover, Text } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import { getQuickStarts } from '../../utils/quick-start-utils';
import QuickStartTileDescription from '../QuickStartTileDescription';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

describe('QuickStartCatalog', () => {
  it('should show prerequisites only if provided', () => {
    const quickStart = getQuickStarts()[0].spec;
    const QuickStartTileDescriptionWrapper = shallow(
      <QuickStartTileDescription description={quickStart.description} />,
    );
    expect(QuickStartTileDescriptionWrapper.find(Text)).toHaveLength(1);
  });

  it('shoould render prerequisites inside a popover', () => {
    const quickStart = getQuickStarts()[2].spec;
    const QuickStartTileDescriptionWrapper = shallow(
      <QuickStartTileDescription
        description={quickStart.description}
        prerequisites={quickStart.prerequisites}
      />,
    );
    expect(QuickStartTileDescriptionWrapper.find(Popover)).toHaveLength(1);
  });
});
