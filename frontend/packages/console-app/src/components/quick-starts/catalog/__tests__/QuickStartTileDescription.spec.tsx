import * as React from 'react';
import { shallow } from 'enzyme';
import { Text } from '@patternfly/react-core';
import QuickStartTileDescription from '../QuickStartTileDescription';
import { getQuickStarts } from '../../utils/quick-start-utils';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

describe('QuickStartCatalog', () => {
  it('should show prerequisites only if provided', () => {
    const QuickStartTileDescriptionProps = getQuickStarts()[0].spec;
    const QuickStartTileDescriptionWrapper = shallow(
      <QuickStartTileDescription description={QuickStartTileDescriptionProps.description} />,
    );
    expect(QuickStartTileDescriptionWrapper.find(Text)).toHaveLength(1);
  });
});
