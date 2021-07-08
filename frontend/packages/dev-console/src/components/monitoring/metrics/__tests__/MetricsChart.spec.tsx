import * as React from 'react';
import { shallow } from 'enzyme';
import EmptyStateQuery from '../EmptyStateQuery';
import { MetricsChart } from '../MetricsChart';

describe('Metrics Chart', () => {
  let props: React.ComponentProps<typeof MetricsChart>;
  beforeEach(() => {
    props = {
      queries: [],
      namespace: 'my-app',
    };
  });

  it('should render EmptyStateQuery if queries are not present', () => {
    props.queries = [];
    const wrapper = shallow(<MetricsChart {...props} />);
    expect(wrapper.find(EmptyStateQuery)).toHaveLength(1);
  });
});
