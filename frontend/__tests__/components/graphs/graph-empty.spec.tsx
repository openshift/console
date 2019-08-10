import * as React from 'react';
import { shallow } from 'enzyme';
import { ChartAreaIcon, ChartBarIcon } from '@patternfly/react-icons';
import { EmptyState, EmptyStateIcon } from '@patternfly/react-core';

import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';
import { LoadingBox } from '@console/internal/components/utils';

describe('<GraphEmpty />', () => {
  it('should render a loading state', () => {
    const wrapper = shallow(<GraphEmpty loading />);
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
  });

  it('should render an empty state', () => {
    const wrapper = shallow(<GraphEmpty />);
    let icon = wrapper.find(EmptyStateIcon);
    expect(wrapper.find(EmptyState).exists()).toBe(true);
    expect(icon.exists()).toBe(true);
    expect(icon.props().icon).toBe(ChartAreaIcon);
    wrapper.setProps({icon: ChartBarIcon});
    icon = wrapper.find(EmptyStateIcon);
    expect(icon.props().icon).toBe(ChartBarIcon);
  });
});
