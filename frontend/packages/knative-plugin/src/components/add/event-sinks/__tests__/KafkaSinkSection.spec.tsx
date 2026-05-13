import { render, screen } from '@testing-library/react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import KafkaSinkSection from '../KafkaSinkSection';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

jest.mock('@console/dev-console/src/components/import/section/FormSection', () => ({
  __esModule: true,
  default: ({ title, children }: { title?: string; children?: React.ReactNode }) => (
    <>
      {title}
      {children}
    </>
  ),
}));

jest.mock('@console/shared', () => ({
  InputField: 'InputField',
  ResourceDropdownField: 'ResourceDropdownField',
  MultiTypeaheadField: 'MultiTypeaheadField',
}));

jest.mock('react-i18next');

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

  it('should render KafkaSink FormSection title', () => {
    render(<KafkaSinkSection title={title} namespace="my-app" />);
    expect(screen.getByText(title)).toBeVisible();
  });

  it('should render BootstrapServers and Topic fields with required and secret as not required', () => {
    render(<KafkaSinkSection title={title} namespace="my-app" />);
    expect(screen.getByTestId('kafkasink-bootstrapservers-field')).toBeInTheDocument();
    expect(screen.getByTestId('kafkasink-topic-field')).toBeInTheDocument();
    expect(screen.getByTestId('kafkasink-secret-field')).toBeInTheDocument();
  });

  it('should render BootstrapServers and topic fields even if secrets loaded failed', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValueOnce({
      secrets: { data: [], loaded: false, loadError: 'Error' },
    });
    render(<KafkaSinkSection title={title} namespace="my-app" />);
    expect(screen.getByTestId('kafkasink-bootstrapservers-field')).toBeInTheDocument();
    expect(screen.getByTestId('kafkasink-topic-field')).toBeInTheDocument();
  });
});
