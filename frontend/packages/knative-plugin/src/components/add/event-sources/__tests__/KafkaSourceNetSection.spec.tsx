import * as React from 'react';
import { shallow } from 'enzyme';
import KafkaSourceNetSection from '../KafkaSourceNetSection';
import SecretKeySelector from '../../SecretKeySelector';

jest.mock('formik', () => ({
  useFormikContext: jest.fn(() => ({
    values: {
      data: {
        kafkasource: {
          net: {
            sasl: {
              enable: true,
              user: { secretKeyRef: { name: '', key: '' } },
              password: { secretKeyRef: { name: '', key: '' } },
            },
            tls: {
              enable: true,
              caCert: { secretKeyRef: { name: '', key: '' } },
              cert: { secretKeyRef: { name: '', key: '' } },
              key: { secretKeyRef: { name: '', key: '' } },
            },
          },
        },
      },
    },
  })),
}));

describe('KafkaSourceNetSection', () => {
  it('should render SecretKeySelector field for tls and sasl when they are enabled', () => {
    const wrapper = shallow(<KafkaSourceNetSection />);
    expect(wrapper.find(SecretKeySelector)).toHaveLength(5);
  });
});
