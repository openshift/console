import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ExternalLink } from '@console/internal/components/utils';
import { MockKnativeResources } from '../../../topology/__tests__/topology-knative-test-data';
import KSRouteSplitListItem from '../KSRouteSplitListItem';
import { getKnativeRoutesLinks } from '../../../utils/resource-overview-utils';

type RoutesOverviewListItemProps = React.ComponentProps<typeof KSRouteSplitListItem>;

describe('KSRouteSplitListItem', () => {
  let wrapper: ShallowWrapper<RoutesOverviewListItemProps>;
  beforeEach(() => {
    const [route] = getKnativeRoutesLinks(
      MockKnativeResources.ksroutes.data[0],
      MockKnativeResources.revisions.data[0],
    );
    wrapper = shallow(<KSRouteSplitListItem route={route} />);
  });

  it('should list the Route', () => {
    expect(wrapper.find('li')).toHaveLength(1);
    expect(
      wrapper
        .find('li')
        .at(0)
        .props().className,
    ).toEqual('list-group-item');
  });

  it('should have route ExternalLink with proper href', () => {
    expect(wrapper.find(ExternalLink)).toHaveLength(1);
    expect(
      wrapper
        .find(ExternalLink)
        .at(0)
        .props().href,
    ).toEqual('http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com');
  });

  it('should not render if url is not available', () => {
    const mockRouteData = {
      ...MockKnativeResources.ksroutes.data[0],
      status: {
        ...MockKnativeResources.ksroutes.data[0].status,
        url: undefined,
        traffic: [
          {
            ...MockKnativeResources.ksroutes.data[0].status.traffic[0],
            percent: undefined,
            url: undefined,
          },
        ],
      },
    };
    const [route] = getKnativeRoutesLinks(mockRouteData, MockKnativeResources.revisions.data[0]);
    wrapper.setProps({ route });
    expect(wrapper.find(ExternalLink)).toHaveLength(0);
  });

  it('should not render if percent is not available', () => {
    const mockRouteData = {
      ...MockKnativeResources.ksroutes.data[0],
      status: {
        ...MockKnativeResources.ksroutes.data[0].status,
        url: undefined,
        traffic: [
          {
            ...MockKnativeResources.ksroutes.data[0].status.traffic[0],
            percent: undefined,
            url: undefined,
          },
        ],
      },
    };
    const [route] = getKnativeRoutesLinks(mockRouteData, MockKnativeResources.revisions.data[0]);
    wrapper.setProps({ route });
    expect(wrapper.find(ExternalLink)).toHaveLength(0);
  });
});
