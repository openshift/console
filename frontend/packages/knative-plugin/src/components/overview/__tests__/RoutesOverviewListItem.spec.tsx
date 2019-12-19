import * as React from 'react';
import { shallow } from 'enzyme';
import { referenceForModel } from '@console/internal/module/k8s';
import { ResourceLink, ExternalLink } from '@console/internal/components/utils';
import { RouteModel } from '@console/knative-plugin';
import RoutesOverviewListItem from '../RoutesOverviewListItem';
import { mockRevisionsData, mockRoutesData } from '../__mocks__/overview-knative-mock';

describe('RoutesOverviewListItem', () => {
  it('should component exists', () => {
    const wrapper = shallow(
      <RoutesOverviewListItem route={mockRoutesData[0]} resource={mockRevisionsData[0]} />,
    );
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should list the Route', () => {
    const wrapper = shallow(
      <RoutesOverviewListItem route={mockRoutesData[0]} resource={mockRevisionsData[0]} />,
    );
    expect(wrapper.find('li')).toHaveLength(1);
    expect(
      wrapper
        .find('li')
        .at(0)
        .props().className,
    ).toEqual('list-group-item');
  });

  it('should have ResourceLink with proper kind', () => {
    const wrapper = shallow(
      <RoutesOverviewListItem route={mockRoutesData[0]} resource={mockRevisionsData[0]} />,
    );
    expect(wrapper.find(ResourceLink)).toHaveLength(1);
    expect(
      wrapper
        .find(ResourceLink)
        .at(0)
        .props().kind,
    ).toEqual(referenceForModel(RouteModel));
  });

  it('should have route ExternalLink with proper href', () => {
    const wrapper = shallow(
      <RoutesOverviewListItem route={mockRoutesData[0]} resource={mockRevisionsData[0]} />,
    );
    expect(wrapper.find(ExternalLink)).toHaveLength(1);
    expect(
      wrapper
        .find(ExternalLink)
        .at(0)
        .props().href,
    ).toEqual('http://tag-portal-v1.jai-test.apps.rhamilto.devcluster.openshift.com');
  });

  it('should have route of specific revision as ExternalLink with proper url', () => {
    const mockRouteData = {
      ...mockRoutesData[0],
      status: {
        ...mockRoutesData[0].status,
        traffic: [
          {
            ...mockRoutesData[0].status.traffic[0],
            tag: 'abc',
            url: 'http://abc-tag-portal-v1.jai-test.apps.rhamilto.devcluster.openshift.com',
          },
        ],
      },
    };
    const wrapper = shallow(
      <RoutesOverviewListItem route={mockRouteData} resource={mockRevisionsData[0]} />,
    );
    expect(wrapper.find(ExternalLink)).toHaveLength(1);
    expect(
      wrapper
        .find(ExternalLink)
        .at(0)
        .props().href,
    ).toEqual('http://abc-tag-portal-v1.jai-test.apps.rhamilto.devcluster.openshift.com');
  });
});
