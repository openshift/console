import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { EVENT_SOURCE_SINK_BINDING_KIND, KNATIVE_EVENT_SOURCE_APIGROUP } from '../../../const';
import { getEventSourceResponse } from '../../../topology/__tests__/topology-knative-test-data';
import EventSourceOwnedList from '../EventSourceOwnedList';

type EventSourceOwnedListProps = React.ComponentProps<typeof EventSourceOwnedList>;

describe('EventSourceOwnedList', () => {
  const mockData: K8sResourceKind = getEventSourceResponse(
    KNATIVE_EVENT_SOURCE_APIGROUP,
    'v1',
    EVENT_SOURCE_SINK_BINDING_KIND,
  ).data[0];
  let wrapper: ShallowWrapper<EventSourceOwnedListProps>;
  beforeEach(() => {
    wrapper = shallow(<EventSourceOwnedList source={mockData} />);
  });

  it('should render SidebarSectionHeading, ResourceLink', () => {
    expect(wrapper.find(SidebarSectionHeading)).toHaveLength(1);
    expect(wrapper.find(ResourceLink)).toHaveLength(1);
  });
});
