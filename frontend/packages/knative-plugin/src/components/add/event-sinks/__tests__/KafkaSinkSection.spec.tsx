/* eslint-disable testing-library/no-container, testing-library/no-node-access -- Mocked components require container queries */
import { render } from '@testing-library/react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import KafkaSinkSection from '../KafkaSinkSection';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

jest.mock('@console/dev-console/src/components/import/section/FormSection', () => ({
  __esModule: true,
  default: ({ children }) => children,
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

  beforeEach(() => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      secrets: { data: [], loaded: true, loadError: null },
    });
  });

  it('should render KafkaSink FormSection', () => {
    const { container } = render(<KafkaSinkSection title={title} namespace="my-app" />);
    expect(container).toBeInTheDocument();
  });

  it('should render BootstrapServers and Topic fields with required and secret as not required', () => {
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

  it('should render BootstrapServers and topic fields even if secrets loaded failed', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValueOnce({
      secrets: { data: [], loaded: false, loadError: 'Error' },
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
