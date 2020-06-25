import * as React from 'react';
import { Link } from 'react-router-dom';
import { shallow } from 'enzyme';
import GuidedTourTile from '../GuidedTourTile';
import { getGuidedToursWithStatus } from '@console/app/src/components/guided-tours/utils/guided-tour-utils';
import { CardActions, Dropdown, CardBody, CardFooter } from '@patternfly/react-core';

type GuidedTourTileProps = React.ComponentProps<typeof GuidedTourTile>;

describe('GuidedTourTile', () => {
  const guidedTourTileProps: GuidedTourTileProps = {
    tours: getGuidedToursWithStatus(),
  };
  const guidedTourTileWrapper = shallow(<GuidedTourTile {...guidedTourTileProps} />);
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
});
