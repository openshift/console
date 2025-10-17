import { render } from '@testing-library/react';
import KafkaSourceNetSection from '../KafkaSourceNetSection';

jest.mock('../../SecretKeySelector', () => ({
  __esModule: true,
  default: 'SecretKeySelector',
}));

jest.mock('formik', () => ({
  useField: jest.fn(() => [{}, {}]),
  useFormikContext: jest.fn(() => ({
    values: {
      formData: {
        data: {
          KafkaSource: {
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
    },
  })),
}));

describe('KafkaSourceNetSection', () => {
  it('should render SecretKeySelector field for tls and sasl when they are enabled', () => {
    const { container } = render(<KafkaSourceNetSection />);
    const secretKeySelectors = container.querySelectorAll('SecretKeySelector');
    expect(secretKeySelectors).toHaveLength(5);
  });
});
