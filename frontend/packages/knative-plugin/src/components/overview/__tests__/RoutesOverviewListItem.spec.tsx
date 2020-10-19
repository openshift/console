import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { referenceForModel } from '@console/internal/module/k8s';
import { ResourceLink } from '@console/internal/components/utils';
import { MockKnativeResources } from '../../../topology/__tests__/topology-knative-test-data';
import { RouteModel } from '../../../models';
import RoutesOverviewListItem from '../RoutesOverviewListItem';
import { getKnativeRoutesLinks } from '../../../utils/resource-overview-utils';
import RoutesUrlLink, { RoutesUrlLinkProps } from '../RoutesUrlLink';

type RoutesOverviewListItemProps = React.ComponentProps<typeof RoutesOverviewListItem>;

describe('RoutesOverviewListItem', () => {
  let wrapper: ShallowWrapper<RoutesOverviewListItemProps>;

  const getRouteUrlLinkProps = (pos: number): RoutesUrlLinkProps =>
    wrapper
      .find(RoutesUrlLink)
      .at(pos)
      .props();

  beforeEach(() => {
    const [routeLink] = getKnativeRoutesLinks(
      MockKnativeResources.ksroutes.data[0],
      MockKnativeResources.revisions.data[0],
    );
    wrapper = shallow(<RoutesOverviewListItem routeLink={routeLink} />);
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
    expect(wrapper.find(RoutesUrlLink)).toHaveLength(1);
    expect(
      wrapper
        .find(RoutesUrlLink)
        .at(0)
        .props().urls,
    ).toEqual(['http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com']);
  });

  it('should have route of specific revision as RoutesUrlLink with tag url and base url', () => {
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
    const [routeLink] = getKnativeRoutesLinks(
      mockRouteData,
      MockKnativeResources.revisions.data[0],
    );

    wrapper.setProps({ routeLink, uniqueRoutes: [mockRouteData.status.traffic[0].url] });
    const { urls: baseUrl, title: baseTitle }: RoutesUrlLinkProps = getRouteUrlLinkProps(0);
    const { urls, title }: RoutesUrlLinkProps = getRouteUrlLinkProps(1);

    expect(wrapper.find(RoutesUrlLink)).toHaveLength(2);
    expect(baseTitle).toEqual('Location');
    expect(baseUrl).toEqual([
      'http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
    ]);
    expect(title).toEqual('Unique Route');
    expect(urls).toEqual([
      'http://abc-overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
    ]);
  });

  it('should have route of specific revision as RoutesUrlLink with multiple tag urls and total percent', () => {
    const [routeLink] = getKnativeRoutesLinks(
      MockKnativeResources.ksroutes.data[0],
      MockKnativeResources.revisions.data[0],
    );

    wrapper.setProps({
      routeLink,
      uniqueRoutes: ['https://tag1.test.com', 'https://tag2.test.com'],
      totalPercent: '50%',
    });
    expect(wrapper.find(RoutesUrlLink)).toHaveLength(2);

    const { urls: baseUrl, title: baseTitle }: RoutesUrlLinkProps = getRouteUrlLinkProps(0);
    const { urls, title }: RoutesUrlLinkProps = getRouteUrlLinkProps(1);
    expect(baseTitle).toEqual('Location');
    expect(baseUrl).toEqual([
      'http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
    ]);
    expect(title).toEqual('Unique Route');
    expect(urls).toEqual(['https://tag1.test.com', 'https://tag2.test.com']);
    expect(wrapper.find('span.text-right').text()).toBe('50%');
  });

  it('should not show the route url and traffic percentage section, if there are not available', () => {
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
    const [routeLink] = getKnativeRoutesLinks(
      mockRouteData,
      MockKnativeResources.revisions.data[0],
    );
    wrapper.setProps({ routeLink });
    expect(wrapper.find(ResourceLink)).toHaveLength(1);
    expect(wrapper.find(RoutesUrlLink)).toHaveLength(0);
    expect(wrapper.find('span.text-right')).toHaveLength(0);
  });
});
