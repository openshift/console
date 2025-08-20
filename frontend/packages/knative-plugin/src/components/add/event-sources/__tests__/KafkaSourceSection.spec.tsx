import { render } from '@testing-library/react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import KafkaSourceSection from '../KafkaSourceSection';
import '@testing-library/jest-dom';

jest.mock('@console/dev-console/src/components/import/section/FormSection', () => ({
  __esModule: true,
  default: 'FormSection',
}));

jest.mock('../KafkaSourceNetSection', () => ({
  __esModule: true,
  default: 'KafkaSourceNetSection',
}));

jest.mock('@console/shared', () => ({
  MultiTypeaheadField: 'MultiTypeaheadField',
  ResourceDropdownField: 'ResourceDropdownField',
  InputField: 'InputField',
}));

jest.mock('formik', () => ({
  useField: jest.fn(() => [{}, {}]),
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    values: {},
  })),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

describe('KafkaSourceSection', () => {
  const title = 'Kafka Source';

  it('should render KafkaSource FormSection with proper title', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      kafkas: { data: [], loaded: true },
      kafkatopics: { data: [], loaded: true },
      kafkaconnections: { data: [], loaded: true },
    });
    const { container } = render(<KafkaSourceSection title={title} namespace="my-app" />);
    expect(container.querySelector('FormSection')).toBeInTheDocument();
  });

  it('should render BootstrapServers and Topics fields with ', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      kafkas: { data: [], loaded: true },
      kafkatopics: { data: [], loaded: true },
      kafkaconnections: { data: [], loaded: true },
    });
    const { container } = render(<KafkaSourceSection title={title} namespace="my-app" />);
    const bootstrapServersField = container.querySelector(
      '[data-test-id="kafkasource-bootstrapservers-field"]',
    );
    expect(bootstrapServersField).toBeInTheDocument();
    expect(bootstrapServersField).toHaveAttribute('required');

    const topicsField = container.querySelector('[data-test-id="kafkasource-topics-field"]');
    expect(topicsField).toBeInTheDocument();
    expect(topicsField).toHaveAttribute('required');
  });

  it('should render consumergroup, netsection', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      kafkas: { data: [], loaded: true },
      kafkatopics: { data: [], loaded: true },
      kafkaconnections: { data: [], loaded: true },
    });
    const { container } = render(<KafkaSourceSection title={title} namespace="my-app" />);
    const consumerGroupField = container.querySelector(
      '[data-test-id="kafkasource-consumergroup-field"]',
    );
    expect(consumerGroupField).toBeInTheDocument();
    expect(consumerGroupField).toHaveAttribute('required');
    expect(container.querySelector('KafkaSourceNetSection')).toBeInTheDocument();
  });

  it('should render BootstrapServers and Topics fields with even if kafkaconnections loaded failed', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      kafkas: { data: [], loaded: true },
      kafkatopics: { data: [], loaded: true },
      kafkaconnections: { data: null, loaded: false, loadError: 'Error' },
    });
    const { container } = render(<KafkaSourceSection title={title} namespace="my-app" />);
    const bootstrapServersField = container.querySelector(
      '[data-test-id="kafkasource-bootstrapservers-field"]',
    );
    expect(bootstrapServersField).toBeInTheDocument();
    expect(bootstrapServersField).toHaveAttribute('required');

    const topicsField = container.querySelector('[data-test-id="kafkasource-topics-field"]');
    expect(topicsField).toBeInTheDocument();
    expect(topicsField).toHaveAttribute('required');
  });
});
