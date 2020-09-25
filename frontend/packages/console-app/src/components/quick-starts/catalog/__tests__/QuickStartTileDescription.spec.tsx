import * as React from 'react';
import { shallow } from 'enzyme';
import { Text } from '@patternfly/react-core';
import QuickStartTileDescription from '../QuickStartTileDescription';
import { getQuickStarts } from '../../utils/quick-start-utils';

describe('QuickStartCatalog', () => {
  it('should show prerequisites only if provided', () => {
    const QuickStartTileDescriptionProps = getQuickStarts()[0].spec;
    const QuickStartTileDescriptionWrapper = shallow(
      <QuickStartTileDescription description={QuickStartTileDescriptionProps.description} />,
    );
    expect(QuickStartTileDescriptionWrapper.find(Text)).toHaveLength(1);
  });
});
