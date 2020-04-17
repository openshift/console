import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as utils from '@console/internal/components/utils';
import { MockKnativeResources } from '../../../topology/__tests__/topology-knative-test-data';
import RoutesOverviewList from '../RoutesOverviewList';
import RoutesOverviewListItem from '../RoutesOverviewListItem';

type RoutesOverviewListProps = React.ComponentProps<typeof RoutesOverviewList>;

describe('RoutesOverviewList', () => {
  let wrapper: ShallowWrapper<RoutesOverviewListProps>;
  beforeEach(() => {
    wrapper = shallow(
      <RoutesOverviewList
        ksroutes={MockKnativeResources.ksroutes.data}
        resource={MockKnativeResources.revisions.data[0]}
      />,
    );
  });

  it('should show info if no Routes present', () => {
    const spyUseAccessReview = jest.spyOn(utils, 'useAccessReview');
    spyUseAccessReview.mockReturnValue(true);
    wrapper = shallow(
      <RoutesOverviewList ksroutes={[]} resource={MockKnativeResources.revisions.data[0]} />,
    );
    expect(wrapper.text().includes('No Routes found for this resource.')).toBeTruthy();
  });

  it('should render RoutesOverviewListItem', () => {
    expect(wrapper.find(RoutesOverviewListItem)).toHaveLength(1);
  });
});
