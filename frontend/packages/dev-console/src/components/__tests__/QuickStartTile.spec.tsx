import * as React from 'react';
import { Link } from 'react-router-dom';
import { shallow } from 'enzyme';
import QuickStartTile, { HIDE_QUICK_START_STORAGE_KEY } from '../QuickStartTile';
import { CardActions, Dropdown, CardBody, CardFooter } from '@patternfly/react-core';

describe('QuickStartTile', () => {
  const QuickStartTileWrapper = shallow(<QuickStartTile />);
  it('should show proper CardAction', () => {
    const cardAction = QuickStartTileWrapper.find(CardActions);
    expect(cardAction.exists()).toBe(true);
    expect(cardAction.find(Dropdown).prop('dropdownItems').length).toEqual(1);
  });
  it('should show 3 tour links', () => {
    const cardBody = QuickStartTileWrapper.find(CardBody);
    expect(cardBody.exists()).toBe(true);
    expect(cardBody.find(Link).length).toEqual(3);
  });
  it('should show a footer link to QuickStartCatalog', () => {
    const cardFooter = QuickStartTileWrapper.find(CardFooter);
    expect(cardFooter.exists()).toBe(true);
    expect(cardFooter.find(Link).exists()).toBe(true);
    expect(cardFooter.find(Link).prop('to')).toEqual('/quickstart');
  });
  it('should hide QuickStartTile when locaStorage is set', () => {
    localStorage.setItem(HIDE_QUICK_START_STORAGE_KEY, 'true');
    const emptyWrapper = shallow(<QuickStartTile />);
    expect(emptyWrapper.find(QuickStartTile).exists()).toBe(false);
  });
});
