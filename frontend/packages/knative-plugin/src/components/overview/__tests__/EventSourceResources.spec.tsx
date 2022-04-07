import * as React from 'react';
import { shallow } from 'enzyme';
import * as _ from 'lodash';
import { ResourceLink, ExternalLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  EVENTING_IMC_KIND,
  EVENT_SOURCE_API_SERVER_KIND,
  EVENT_SOURCE_CAMEL_KIND,
  KNATIVE_EVENT_MESSAGE_APIGROUP,
  KNATIVE_EVENT_SOURCE_APIGROUP,
} from '../../../const';
import { ServiceModel } from '../../../models';
import { getEventSourceResponse } from '../../../topology/__tests__/topology-knative-test-data';
import { EventSourceTarget } from '../EventSourceResources';

jest.mock('@console/shared', () => {
  const ActualShared = require.requireActual('@console/shared');
  return {
    ...ActualShared,
    usePodsWatcher: jest.fn(),
  };
});

describe('EventSinkServicesOverviewList', () => {
  it('should show error info if no sink present or sink,kind is incorrect', () => {
    const mockData = _.omit(
      _.cloneDeep(
        getEventSourceResponse(KNATIVE_EVENT_SOURCE_APIGROUP, 'v1alpha1', EVENT_SOURCE_CAMEL_KIND)
          .data[0],
      ),
      ['spec', 'status'],
    );
    const wrapper = shallow(<EventSourceTarget obj={mockData} />);
    expect(wrapper.find('span').text()).toBe('No sink found for this resource.');
  });

  it('should have ResourceLink with proper kind for sink to knSvc', () => {
    const wrapper = shallow(
      <EventSourceTarget
        obj={
          getEventSourceResponse(KNATIVE_EVENT_SOURCE_APIGROUP, 'v1', EVENT_SOURCE_API_SERVER_KIND)
            .data[0]
        }
      />,
    );
    const findResourceLink = wrapper.find(ResourceLink);
    expect(findResourceLink).toHaveLength(1);
    expect(findResourceLink.at(0).props().kind).toEqual(referenceForModel(ServiceModel));
  });

  it('should have ResourceLink with proper kind for sink to channel', () => {
    const sinkData = {
      sink: {
        apiVersion: `${KNATIVE_EVENT_MESSAGE_APIGROUP}/v1`,
        kind: EVENTING_IMC_KIND,
        name: 'testchannel',
      },
    };
    const sinkChannelData = {
      ...getEventSourceResponse(KNATIVE_EVENT_SOURCE_APIGROUP, 'v1', EVENT_SOURCE_API_SERVER_KIND)
        .data[0],
      ...{ spec: sinkData },
    };
    const wrapper = shallow(<EventSourceTarget obj={sinkChannelData} />);
    const findResourceLink = wrapper.find(ResourceLink);
    expect(findResourceLink).toHaveLength(1);
    expect(findResourceLink.at(0).props().kind).toEqual('messaging.knative.dev~v1~InMemoryChannel');
  });

  it('should have only external link and not ResourceLink for sink to uri', () => {
    const mockData = {
      ...getEventSourceResponse(KNATIVE_EVENT_SOURCE_APIGROUP, 'v1alpha1', EVENT_SOURCE_CAMEL_KIND)
        .data[0],
      spec: {
        uri: 'http://overlayimage.testproject3.svc.cluster.local',
      },
    };
    const wrapper = shallow(<EventSourceTarget obj={mockData} />);
    expect(wrapper.find(ExternalLink)).toHaveLength(1);
    expect(wrapper.find(ResourceLink)).toHaveLength(0);
  });

  it('should have ExternalLink when sinkUri is present', () => {
    const wrapper = shallow(
      <EventSourceTarget
        obj={
          getEventSourceResponse(KNATIVE_EVENT_SOURCE_APIGROUP, 'v1', EVENT_SOURCE_API_SERVER_KIND)
            .data[0]
        }
      />,
    );
    expect(wrapper.find(ExternalLink)).toHaveLength(1);
  });

  it('should not have ExternalLink when no sinkUri is present', () => {
    const mockEventSourceDataNoURI = _.omit(
      getEventSourceResponse(KNATIVE_EVENT_SOURCE_APIGROUP, 'v1', EVENT_SOURCE_API_SERVER_KIND)
        .data[0],
      'status',
    );
    const wrapper = shallow(<EventSourceTarget obj={mockEventSourceDataNoURI} />);
    expect(wrapper.find(ExternalLink)).toHaveLength(0);
  });
});
