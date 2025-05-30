import { shallow } from 'enzyme';

import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';

describe('<GraphEmpty />', () => {
  it('should render a loading state', () => {
    const wrapper = shallow(<GraphEmpty loading />);
    expect(wrapper.find('.skeleton-chart').exists()).toBe(true);
  });

  it('should render an empty state', () => {
    const wrapper = shallow(<GraphEmpty />);
    expect(wrapper.find('.pf-v6-u-text-color-subtle').exists()).toBe(true);
    expect(wrapper.text()).toEqual('No datapoints found.');
  });
});
