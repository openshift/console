import * as React from 'react';
import { Link } from 'react-router-dom';
import { shallow } from 'enzyme';
import GuidedTourTile, { HIDE_TOUR_TILE_STORAGE_KEY } from '../GuidedTourTile';
import { CardActions, Dropdown, CardBody, CardFooter } from '@patternfly/react-core';

describe('GuidedTourTile', () => {
  const guidedTourTileWrapper = shallow(<GuidedTourTile />);
  it('should show proper CardAction', () => {
    const cardAction = guidedTourTileWrapper.find(CardActions);
    expect(cardAction.exists()).toBe(true);
    expect(cardAction.find(Dropdown).prop('dropdownItems').length).toEqual(1);
  });
  it('should show 3 tour links', () => {
    const cardBody = guidedTourTileWrapper.find(CardBody);
    expect(cardBody.exists()).toBe(true);
    expect(cardBody.find(Link).length).toEqual(3);
  });
  it('should show a footer link to GuidedTourCatalog', () => {
    const cardFooter = guidedTourTileWrapper.find(CardFooter);
    expect(cardFooter.exists()).toBe(true);
    expect(cardFooter.find(Link).exists()).toBe(true);
    expect(cardFooter.find(Link).prop('to')).toEqual('/tours');
  });
  it('should hide GuidedTourTile when locaStorage is set', () => {
    localStorage.setItem(HIDE_TOUR_TILE_STORAGE_KEY, 'true');
    const emptyWrapper = shallow(<GuidedTourTile />);
    expect(emptyWrapper.find(GuidedTourTile).exists()).toBe(false);
  });
});
