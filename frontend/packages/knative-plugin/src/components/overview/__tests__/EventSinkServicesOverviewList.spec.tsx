import * as React from 'react';
import { shallow } from 'enzyme';
import * as _ from 'lodash';
import { referenceForModel } from '@console/internal/module/k8s';
import { sampleEventSourceContainers } from '@console/dev-console/src/components/topology/__tests__/topology-knative-test-data';
import { ResourceLink, ExternalLink } from '@console/internal/components/utils';
import { ServiceModel } from '@console/knative-plugin';
import EventSinkServicesOverviewList from '../EventSinkServicesOverviewList';

describe('EventSinkServicesOverviewList', () => {
  it('should show error info if no sink present or sink,kind is incorrect', () => {
    const mockEventSourceEmpty = {};
    const wrapper = shallow(<EventSinkServicesOverviewList obj={mockEventSourceEmpty} />);
    expect(wrapper.text().includes('No services found for this resource.')).toBe(true);
  });

  it('should have ResourceLink with proper kind', () => {
    const wrapper = shallow(
      <EventSinkServicesOverviewList obj={sampleEventSourceContainers.data[0]} />,
    );
    const findResourceLink = wrapper.find(ResourceLink);
    expect(findResourceLink).toHaveLength(1);
    expect(findResourceLink.at(0).props().kind).toEqual(referenceForModel(ServiceModel));
  });

  it('should have ExternaLink when sinkUri is present', () => {
    const wrapper = shallow(
      <EventSinkServicesOverviewList obj={sampleEventSourceContainers.data[0]} />,
    );
    expect(wrapper.find(ExternalLink)).toHaveLength(1);
  });

  it('should not have ExternalLink when no sinkUri is present', () => {
    const mockEventSourceDataNoURI = _.omit(sampleEventSourceContainers.data[0], 'status');
    const wrapper = shallow(<EventSinkServicesOverviewList obj={mockEventSourceDataNoURI} />);
    expect(wrapper.find(ExternalLink)).toHaveLength(0);
  });
});
