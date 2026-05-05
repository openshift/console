import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import KafkaSourceSection from '../KafkaSourceSection';

jest.mock('@console/dev-console/src/components/import/section/FormSection', () => ({
  __esModule: true,
  default: ({ children, title }: { children?: ReactNode; title?: ReactNode }) => (
    <div>
      {title != null ? <h2>{title}</h2> : null}
      {children}
    </div>
  ),
}));

jest.mock('../KafkaSourceNetSection', () => ({
  __esModule: true,
  default: jest
    .requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .createKnativeTextStub('mock-KafkaSourceNetSection'),
}));

jest.mock('@console/shared', () => ({
  MultiTypeaheadField: ({ label, ...rest }: { label?: string; [k: string]: unknown }) => (
    <input type="text" aria-label={label} {...(rest as ComponentPropsWithoutRef<'input'>)} />
  ),
  ResourceDropdownField: 'ResourceDropdownField',
  InputField: ({ label, ...rest }: { label?: string; [k: string]: unknown }) => (
    <input type="text" aria-label={label} {...(rest as ComponentPropsWithoutRef<'input'>)} />
  ),
}));

jest.mock('react-i18next');

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
    render(<KafkaSourceSection title={title} namespace="my-app" />);
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  });

  it('should render BootstrapServers and Topics fields with ', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      kafkas: { data: [], loaded: true },
      kafkatopics: { data: [], loaded: true },
      kafkaconnections: { data: [], loaded: true },
    });
    render(<KafkaSourceSection title={title} namespace="my-app" />);
    const bootstrapServersField = screen.getByRole('textbox', {
      name: 'Bootstrap servers',
    });
    expect(bootstrapServersField).toBeInTheDocument();
    expect(bootstrapServersField).toBeRequired();

    const topicsField = screen.getByRole('textbox', { name: 'Topics' });
    expect(topicsField).toBeInTheDocument();
    expect(topicsField).toBeRequired();
  });

  it('should render consumergroup, netsection', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      kafkas: { data: [], loaded: true },
      kafkatopics: { data: [], loaded: true },
      kafkaconnections: { data: [], loaded: true },
    });
    render(<KafkaSourceSection title={title} namespace="my-app" />);
    const consumerGroupField = screen.getByRole('textbox', {
      name: 'Consumer group',
    });
    expect(consumerGroupField).toBeInTheDocument();
    expect(consumerGroupField).toBeRequired();
    expect(screen.getByText('mock-KafkaSourceNetSection')).toBeVisible();
  });

  it('should render BootstrapServers and Topics fields with even if kafkaconnections loaded failed', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      kafkas: { data: [], loaded: true },
      kafkatopics: { data: [], loaded: true },
      kafkaconnections: { data: null, loaded: false, loadError: 'Error' },
    });
    render(<KafkaSourceSection title={title} namespace="my-app" />);
    const bootstrapServersField = screen.getByRole('textbox', {
      name: 'Bootstrap servers',
    });
    expect(bootstrapServersField).toBeInTheDocument();
    expect(bootstrapServersField).toBeRequired();

    const topicsField = screen.getByRole('textbox', { name: 'Topics' });
    expect(topicsField).toBeInTheDocument();
    expect(topicsField).toBeRequired();
  });
});
