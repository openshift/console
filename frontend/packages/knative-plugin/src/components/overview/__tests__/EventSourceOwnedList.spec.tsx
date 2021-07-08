import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { EventSourceSinkBindingModel } from '../../../models';
import { getEventSourceResponse } from '../../../topology/__tests__/topology-knative-test-data';
import EventSourceOwnedList from '../EventSourceOwnedList';

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
