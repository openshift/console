import * as React from 'react';
import { shallow } from 'enzyme';
import * as _ from 'lodash';
import { referenceForModel, PodKind } from '@console/internal/module/k8s';
import { PodControllerOverviewItem } from '@console/shared';
import { PodsOverview } from '@console/internal/components/overview/pods-overview';
import {
  ResourceLink,
  ExternalLink,
  SidebarSectionHeading,
} from '@console/internal/components/utils';
import { getEventSourceResponse } from '../../../topology/__tests__/topology-knative-test-data';
import {
  ServiceModel,
  EventSourceApiServerModel,
  EventSourceCamelModel,
  EventingIMCModel,
} from '../../../models';
import EventSinkServicesOverviewList from '../EventSinkServicesOverviewList';

describe('EventSinkServicesOverviewList', () => {
  const current: PodControllerOverviewItem = {
    obj: {
      metadata: {
        name: 'apiserversource-es-1-3f120723-370a-4a08-9eb6-791a7bc90621-5898f657c4',
        uid: '724ec872-ec82-4362-a933-d7a6e54ccfd8',
        namespace: 'testproject1',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            name: 'apiserversource-es-1-3f120723-370a-4a08-9eb6-791a7bc90621',
            uid: 'efe9d39b-e16c-4f05-a82f-0ae1a80e20de',
          },
        ],
      },
    },
    revision: 1,
    alerts: {},
    pods: [
      {
        metadata: {
          name: 'apiserversource-es-1-3f120723-370a-4a08-9eb6-791a7bc90621-58wpf6b',
          uid: 'b893336d-fe16-4fb5-ba29-cb2353ca0301',
          namespace: 'testproject1',
        },
        status: {
          phase: 'Running',
        },
      },
    ],
  };

  const pods: PodKind[] = [
    {
      metadata: {
        name: 'apiserversource-es-1-3f120723-370a-4a08-9eb6-791a7bc90621-58wpf6b',
        uid: 'b893336d-fe16-4fb5-ba29-cb2353ca0301',
        namespace: 'testproject1',
      },
      spec: {
        containers: [],
      },
      status: {
        phase: 'Running',
      },
    },
  ];

  it('should show error info if no sink present or sink,kind is incorrect', () => {
    const mockData = _.omit(_.cloneDeep(getEventSourceResponse(EventSourceCamelModel).data[0]), [
      'spec',
      'status',
    ]);
    const wrapper = shallow(<EventSinkServicesOverviewList obj={mockData} />);
    expect(wrapper.find('span').text()).toBe('No sink found for this resource.');
  });

  it('should have ResourceLink with proper kind for sink to knSvc', () => {
    const wrapper = shallow(
      <EventSinkServicesOverviewList
        obj={getEventSourceResponse(EventSourceApiServerModel).data[0]}
      />,
    );
    const findResourceLink = wrapper.find(ResourceLink);
    expect(findResourceLink).toHaveLength(1);
    expect(findResourceLink.at(0).props().kind).toEqual(referenceForModel(ServiceModel));
  });

  it('should have ResourceLink with proper kind for sink to channel', () => {
    const sinkData = {
      sink: {
        apiVersion: `${EventingIMCModel.apiGroup}/${EventingIMCModel.apiVersion}`,
        kind: EventingIMCModel.kind,
        name: 'testchannel',
      },
    };
    const sinkChannelData = {
      ...getEventSourceResponse(EventSourceApiServerModel).data[0],
      ...{ spec: sinkData },
    };
    const wrapper = shallow(<EventSinkServicesOverviewList obj={sinkChannelData} />);
    const findResourceLink = wrapper.find(ResourceLink);
    expect(findResourceLink).toHaveLength(1);
    expect(findResourceLink.at(0).props().kind).toEqual(referenceForModel(EventingIMCModel));
  });

  it('should have only external link and not ResourceLink for sink to uri', () => {
    const mockData = {
      ...getEventSourceResponse(EventSourceCamelModel).data[0],
      spec: {
        uri: 'http://overlayimage.testproject3.svc.cluster.local',
      },
    };
    const wrapper = shallow(<EventSinkServicesOverviewList obj={mockData} />);
    expect(wrapper.find(ExternalLink)).toHaveLength(1);
    expect(wrapper.find(ResourceLink)).toHaveLength(0);
  });

  it('should have ExternaLink when sinkUri is present', () => {
    const wrapper = shallow(
      <EventSinkServicesOverviewList
        obj={getEventSourceResponse(EventSourceApiServerModel).data[0]}
      />,
    );
    expect(wrapper.find(ExternalLink)).toHaveLength(1);
  });

  it('should not have ExternalLink when no sinkUri is present', () => {
    const mockEventSourceDataNoURI = _.omit(
      getEventSourceResponse(EventSourceApiServerModel).data[0],
      'status',
    );
    const wrapper = shallow(<EventSinkServicesOverviewList obj={mockEventSourceDataNoURI} />);
    expect(wrapper.find(ExternalLink)).toHaveLength(0);
  });

  it('should show Deployment if present', () => {
    const wrapper = shallow(
      <EventSinkServicesOverviewList
        obj={getEventSourceResponse(EventSourceApiServerModel).data[0]}
        current={current}
      />,
    );
    const findResourceLink = wrapper.find(ResourceLink);
    const findSidebarSectionHeading = wrapper.find(SidebarSectionHeading);
    expect(findSidebarSectionHeading).toHaveLength(2);
    expect(findResourceLink).toHaveLength(2);
    expect(findResourceLink.at(1).props().kind).toEqual('Deployment');
    expect(findSidebarSectionHeading.at(1).props().text).toEqual('Deployment');
  });

  it('should show pods if present', () => {
    const wrapper = shallow(
      <EventSinkServicesOverviewList
        obj={getEventSourceResponse(EventSourceApiServerModel).data[0]}
        current={current}
        pods={pods}
      />,
    );
    expect(wrapper.find(PodsOverview)).toHaveLength(1);
    expect(wrapper.find(PodsOverview).props().allPodsLink).toEqual(
      '/search/ns/testproject3?kind=Pod&q=sources.knative.dev%2FapiServerSource%3Doverlayimage',
    );
  });

  it('should not show pods if not present', () => {
    const wrapper = shallow(
      <EventSinkServicesOverviewList
        obj={getEventSourceResponse(EventSourceApiServerModel).data[0]}
        current={current}
      />,
    );
    expect(wrapper.find(PodsOverview)).toHaveLength(0);
  });
});
