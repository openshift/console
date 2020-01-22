import * as React from 'react';
import { shallow } from 'enzyme';
import { Button } from '@patternfly/react-core';
import { Dropdown } from '@console/internal/components/utils';
import { QueryInput } from '@console/internal/components/monitoring/metrics';
import { MetricsQueryInput } from '../MetricsQueryInput';

describe('Metrics Query Input', () => {
  let props: React.ComponentProps<typeof MetricsQueryInput>;
  beforeEach(() => {
    props = {
      namespace: 'my-app',
      patchQuery: jest.fn(),
      runQueries: jest.fn(),
    };
  });

  it('should render Dropdown with default title', () => {
    const wrapper = shallow(<MetricsQueryInput {...props} />);
    expect(wrapper.find(Dropdown)).toHaveLength(1);
    expect(wrapper.find(Dropdown).props().title).toEqual('Select Query');
  });

  it('should render Button with text "Show PromQL" and not render QueryInput', () => {
    const wrapper = shallow(<MetricsQueryInput {...props} />);
    expect(wrapper.find(Button)).toHaveLength(1);
    expect(wrapper.find(Button).props().children).toEqual('Show PromQL');
    expect(wrapper.find(QueryInput).exists()).toBe(false);
  });

  it('should update Button with text "Hide PromQL" on click and render QueryInput', () => {
    const wrapper = shallow(<MetricsQueryInput {...props} />);
    wrapper.find(Button).simulate('click');
    expect(wrapper.find(Button).props().children).toEqual('Hide PromQL');
    expect(wrapper.find(QueryInput)).toHaveLength(1);
  });

  it('Custom Querey selection should update Dropdown title, show QueryInput and Button in disabled state', () => {
    const wrapper = shallow(<MetricsQueryInput {...props} />);
    wrapper
      .find(Dropdown)
      .props()
      .onChange('#ADD_NEW_QUERY#');
    expect(wrapper.find(QueryInput)).toHaveLength(1);
    expect(wrapper.find(Button).props().children).toEqual('Hide PromQL');
    expect(wrapper.find(Button).props().isDisabled).toBe(true);
    expect(wrapper.find(Dropdown).props().title).toEqual('Custom Query');
  });

  it('Metric selection should update Dropdown title and show Button in enabled state', () => {
    const wrapper = shallow(<MetricsQueryInput {...props} />);
    wrapper
      .find(Dropdown)
      .props()
      .onChange('PODS_BY_CPU');
    expect(wrapper.find(Button).props().isDisabled).toBe(false);
    expect(wrapper.find(Dropdown).props().title).toEqual('PODS_BY_CPU');
  });
});
