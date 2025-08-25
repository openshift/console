import { render } from '@testing-library/react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import KafkaSinkSection from '../KafkaSinkSection';
import '@testing-library/jest-dom';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

jest.mock('@console/dev-console/src/components/import/section/FormSection', () => ({
  __esModule: true,
  default: 'FormSection',
}));

jest.mock('@console/shared', () => ({
  InputField: 'InputField',
  ResourceDropdownField: 'ResourceDropdownField',
  MultiTypeaheadField: 'MultiTypeaheadField',
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../../../hooks', () => ({
  useBootstrapServers: jest.fn(() => [[], 'placeholder']),
}));

describe('KafkaSinkSection', () => {
  const title = 'Kafka Sink';

  it('should render KafkaSink FormSection with proper title', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      kafkas: { data: [], loaded: true },
      kafkaconnections: { data: [], loaded: true },
    });
    const { container } = render(<KafkaSinkSection title={title} namespace="my-app" />);
    expect(container.querySelector('FormSection')).toBeInTheDocument();
  });

  it('should render BootstrapServers and Topic fields with required and secret as not required', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      kafkas: { data: [], loaded: true },
      kafkaconnections: { data: [], loaded: true },
    });
    const { container } = render(<KafkaSinkSection title={title} namespace="my-app" />);
    const bootstrapServersField = container.querySelector(
      '[data-test="kafkasink-bootstrapservers-field"]',
    );
    expect(bootstrapServersField).toBeInTheDocument();

    const topicsField = container.querySelector('[data-test="kafkasink-topic-field"]');
    expect(topicsField).toBeInTheDocument();

    const secretField = container.querySelector('[data-test="kafkasink-secret-field"]');
    expect(secretField).toBeInTheDocument();
  });

  it('should render BootstrapServers and topic fields with even if kafkaconnections loaded failed', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      kafkas: { data: [], loaded: true },
      kafkaconnections: { data: null, loaded: false, loadError: 'Error' },
    });
    const { container } = render(<KafkaSinkSection title={title} namespace="my-app" />);
    const bootstrapServersField = container.querySelector(
      '[data-test="kafkasink-bootstrapservers-field"]',
    );
    expect(bootstrapServersField).toBeInTheDocument();

    const topicsField = container.querySelector('[data-test="kafkasink-topic-field"]');
    expect(topicsField).toBeInTheDocument();
  });
});
