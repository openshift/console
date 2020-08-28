import * as React from 'react';
import { Link } from 'react-router-dom';
import { shallow } from 'enzyme';
import useQuickStarts from '@console/app/src/components/quick-starts/utils/useQuickStarts';
import { getQuickStarts } from '@console/app/src/components/quick-starts/utils/quick-start-utils';
import {
  InternalQuickStartTile as QuickStartTile,
  HIDE_QUICK_START_ADD_TILE_STORAGE_KEY,
} from '../QuickStartTile';
import { CardActions, Dropdown, CardBody, CardFooter, Button } from '@patternfly/react-core';

jest.mock('@console/app/src/components/quick-starts/utils/useQuickStarts', () => ({
  default: jest.fn(),
}));

const mockQuickStarts = getQuickStarts();

describe('QuickStartTile', () => {
  (useQuickStarts as jest.Mock).mockReturnValue(mockQuickStarts);
  const QuickStartTileWrapper = shallow(<QuickStartTile />);

  it('should show proper CardAction', () => {
    const cardAction = QuickStartTileWrapper.find(CardActions);
    expect(cardAction.exists()).toBe(true);
    expect(cardAction.find(Dropdown).prop('dropdownItems').length).toEqual(1);
  });

  it('should show 3 tour links', () => {
    const cardBody = QuickStartTileWrapper.find(CardBody);
    expect(cardBody.exists()).toBe(true);
    expect(cardBody.find(Button).length).toEqual(3);
  });

  it('should show a footer link to QuickStartCatalog', () => {
    const cardFooter = QuickStartTileWrapper.find(CardFooter);
    expect(cardFooter.exists()).toBe(true);
    expect(cardFooter.find(Link).exists()).toBe(true);
    expect(cardFooter.find(Link).prop('to')).toEqual('/quickstart');
  });

  it('should hide QuickStartTile when locaStorage is set', () => {
    localStorage.setItem(HIDE_QUICK_START_ADD_TILE_STORAGE_KEY, 'true');
    const emptyWrapper = shallow(<QuickStartTile />);
    expect(emptyWrapper.find(QuickStartTile).exists()).toBe(false);
  });
});
