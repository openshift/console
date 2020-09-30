import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as utils from '@console/internal/components/utils';
import { MockKnativeResources } from '../../../topology/__tests__/topology-knative-test-data';
import RoutesOverviewList from '../RoutesOverviewList';
import RoutesOverviewListItem from '../RoutesOverviewListItem';
import { K8sResourceKind } from '@console/internal/module/k8s/types';

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

  it('should render RoutesOverviewListItem without unique routes', () => {
    const routesOverviewListItemProps = wrapper.find(RoutesOverviewListItem).props();
    expect(routesOverviewListItemProps.uniqueRoutes).toHaveLength(0);
  });

  it('should render RoutesOverviewListItem with unique routes', () => {
    const mockRouteData: K8sResourceKind = {
      ...MockKnativeResources.ksroutes.data[0],
      status: {
        ...MockKnativeResources.ksroutes.data[0].status,
        traffic: [
          {
            ...MockKnativeResources.ksroutes.data[0].status.traffic[0],
            tag: 'tag1',
            url: 'http://tag1.test.com',
          },
        ],
      },
    };

    wrapper.setProps({ ksroutes: [mockRouteData] });
    const routesOverviewListItemProps = wrapper.find(RoutesOverviewListItem).props();
    expect(routesOverviewListItemProps.uniqueRoutes).toHaveLength(1);
    expect(routesOverviewListItemProps.uniqueRoutes).toEqual(['http://tag1.test.com']);
  });

  it('should handle multiple traffic splitting for the same revision', () => {
    const mockRouteData: K8sResourceKind = {
      ...MockKnativeResources.ksroutes.data[0],
      status: {
        ...MockKnativeResources.ksroutes.data[0].status,
        traffic: [
          {
            ...MockKnativeResources.ksroutes.data[0].status.traffic[0],
            tag: 'tag1',
            url: 'http://tag1.test.com',
            percent: 20,
          },
          {
            ...MockKnativeResources.ksroutes.data[0].status.traffic[0],
            tag: 'tag2',
            url: 'http://tag2.test.com',
            percent: 30,
          },
        ],
      },
    };

    wrapper.setProps({ ksroutes: [mockRouteData] });

    const routesOverviewListItemProps = wrapper.find(RoutesOverviewListItem).props();
    expect(routesOverviewListItemProps.uniqueRoutes).toHaveLength(2);
    expect(routesOverviewListItemProps.uniqueRoutes).toEqual([
      'http://tag1.test.com',
      'http://tag2.test.com',
    ]);
    expect(routesOverviewListItemProps.totalPercent).toEqual('50%');
  });
});
