import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { Phase, PhaseProps } from '../../../../../public/components/operator-lifecycle-manager/descriptors/status/phase';

describe(Phase.displayName, () => {
  let wrapper: ShallowWrapper<PhaseProps>;

  beforeEach(() => {
    wrapper = shallow(<Phase status={null} />);
  });

  it('renders icon for failed status', () => {
    const status = 'Failed';
    wrapper.setProps({status});

    expect(wrapper.find('.co-error').exists()).toBe(true);
    expect(wrapper.find('[data-test-id="ban-icon"]').exists()).toBe(true);
  });

  it('renders status text', () => {
    const status = 'Running';
    wrapper.setProps({status});

    expect(wrapper.find('.co-error').exists()).toBe(false);
    expect(wrapper.text()).toContain(status);
    expect(wrapper.find('[data-test-id="ban-icon"]').exists()).toBe(false);
  });
});
