import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { Details } from '../../public/components/alert-manager';

describe('Alert Manager Details', () => {
  let wrapper: ShallowWrapper<any>;

  beforeEach(() => {
    wrapper = shallow(
      <Details
        obj={{
          kind: 'Alertmanager',
          spec: {
            nodeSelector: {
              'kubernetes.io/os': 'linux',
            },
            replicas: 3,
          },
          metadata: { name: 'test', namespace: 'test' },
        }}
      />,
    );
  });

  it('should render pencil edit buttons correctly', () => {
    expect(wrapper.find('.co-m-pane__details dt EditButton').exists()).toBe(true);
  });
});
