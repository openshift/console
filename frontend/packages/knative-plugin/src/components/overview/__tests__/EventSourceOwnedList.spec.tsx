import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import EventSourceOwnedList from '../EventSourceOwnedList';
import { getEventSourceResponse } from '../../../topology/__tests__/topology-knative-test-data';
import { EventSourceSinkBindingModel } from '../../../models';

type EventSourceOwnedListProps = React.ComponentProps<typeof EventSourceOwnedList>;

describe('EventSourceOwnedList', () => {
  const mockData: K8sResourceKind = getEventSourceResponse(EventSourceSinkBindingModel).data[0];
  let wrapper: ShallowWrapper<EventSourceOwnedListProps>;
  beforeEach(() => {
    wrapper = shallow(<EventSourceOwnedList source={mockData} />);
  });

  it('should render SidebarSectionHeading, ResourceLink', () => {
    expect(wrapper.find(SidebarSectionHeading)).toHaveLength(1);
    expect(wrapper.find(ResourceLink)).toHaveLength(1);
  });
});
