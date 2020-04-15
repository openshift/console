import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { referenceForModel } from '@console/internal/module/k8s';
import { ResourceLink, ExternalLink } from '@console/internal/components/utils';
import { MockKnativeResources } from '@console/dev-console/src/components/topology/__tests__/topology-knative-test-data';
import { RouteModel } from '../../../models';
import RoutesOverviewListItem from '../RoutesOverviewListItem';

type RoutesOverviewListItemProps = React.ComponentProps<typeof RoutesOverviewListItem>;

describe('RoutesOverviewListItem', () => {
  let wrapper: ShallowWrapper<RoutesOverviewListItemProps>;
  beforeEach(() => {
    wrapper = shallow(
      <RoutesOverviewListItem
        route={MockKnativeResources.ksroutes.data[0]}
        resource={MockKnativeResources.revisions.data[0]}
      />,
    );
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

  it('should have ResourceLink with proper kind', () => {
    expect(wrapper.find(ResourceLink)).toHaveLength(1);
    expect(
      wrapper
        .find(ResourceLink)
        .at(0)
        .props().kind,
    ).toEqual(referenceForModel(RouteModel));
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

  it('should have route of specific revision as ExternalLink with proper url', () => {
    const mockRouteData = {
      ...MockKnativeResources.ksroutes.data[0],
      status: {
        ...MockKnativeResources.ksroutes.data[0].status,
        traffic: [
          {
            ...MockKnativeResources.ksroutes.data[0].status.traffic[0],
            tag: 'abc',
            url:
              'http://abc-overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
          },
        ],
      },
    };
    wrapper = shallow(
      <RoutesOverviewListItem
        route={mockRouteData}
        resource={MockKnativeResources.revisions.data[0]}
      />,
    );
    expect(wrapper.find(ExternalLink)).toHaveLength(1);
    expect(
      wrapper
        .find(ExternalLink)
        .at(0)
        .props().href,
    ).toEqual(
      'http://abc-overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
    );
  });
});
