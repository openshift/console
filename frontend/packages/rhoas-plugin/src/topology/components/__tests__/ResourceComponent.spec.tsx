import * as React from 'react';
import { shallow } from 'enzyme';
import { ResourceLink } from '@console/internal/components/utils';
import { mockKafkaConnection } from '../__mocks__/kafka-connection-mock';
import { ResourcesComponent } from '../ResourceComponent';

describe('ResourceComponent', () => {
  it('Should show secret if exists', () => {
    const wrapper = shallow(<ResourcesComponent obj={mockKafkaConnection} />);
    expect(wrapper.find(ResourceLink)).toHaveLength(1);
  });

  it('Should not list secret if doesnot exists', () => {
    const mockKcData = {
      ...mockKafkaConnection,
      spec: {
        accessTokenSecretName: '',
        credentials: {
          serviceAccountSecretName: '',
        },
      },
    };
    const wrapper = shallow(<ResourcesComponent obj={mockKcData} />);
    expect(wrapper.find(ResourceLink).exists()).toBe(false);
  });
});
