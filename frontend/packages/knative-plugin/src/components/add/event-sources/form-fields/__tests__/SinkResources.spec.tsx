import { screen } from '@testing-library/react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import SinkResources from '../SinkResources';

jest.mock('@patternfly/react-topology', () => ({}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

jest.mock('../../../../../utils/fetch-dynamic-eventsources-utils', () => ({
  useChannelModels: jest.fn(() => ({ loaded: true, eventSourceChannels: [] })),
}));

jest.mock('@console/shared', () => ({
  ResourceDropdownField: jest
    .requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .createKnativeTextStub('mock-ResourceDropdownField'),
  getFieldId: jest.fn(() => 'mocked-field-id'),
}));

jest.mock('formik', () => ({
  useField: jest.fn(() => [{}, {}]),
  useFormikContext: jest.fn(() => ({
    initialValues: {
      formData: { sink: { name: 'test' } },
    },
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    validateForm: jest.fn(),
  })),
}));

describe('SinkResources', () => {
  beforeEach(() => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      services: { data: [], loaded: true, loadError: null },
      ksservices: { data: [], loaded: true, loadError: null },
      brokers: { data: [], loaded: true, loadError: null },
      kafkasinks: { data: [], loaded: true, loadError: null },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be able to sink to k8s service', () => {
    renderWithProviders(<SinkResources isMoveSink namespace="test" />);
    expect(screen.getByText('mock-ResourceDropdownField')).toBeVisible();
  });

  it('should be able to sink to knative service, broker, k8s service and channels', async () => {
    renderWithProviders(<SinkResources isMoveSink namespace="test" />);
    expect(await screen.findByText('mock-ResourceDropdownField')).toBeVisible();
  });
});
