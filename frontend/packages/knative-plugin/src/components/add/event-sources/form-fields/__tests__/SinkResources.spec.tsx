import { render } from '@testing-library/react';
import * as coFetchModule from '@console/dynamic-plugin-sdk/src/utils/fetch/console-fetch';
import { mockChannelCRDData } from '../../../../../utils/__mocks__/dynamic-channels-crd-mock';
import { fetchChannelsCrd } from '../../../../../utils/fetch-dynamic-eventsources-utils';
import SinkResources from '../SinkResources';

jest.mock('@console/shared', () => ({
  ResourceDropdownField: 'ResourceDropdownField',
  getFieldId: jest.fn(() => 'mocked-field-id'),
}));

jest.mock('formik', () => ({
  useField: jest.fn(() => [{}, {}]),
  useFormikContext: jest.fn(() => ({
    initialValues: {
      formData: { sink: { name: 'test' } },
    },
  })),
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/fetch/console-fetch', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/fetch/console-fetch'),
  consoleFetch: jest.fn(),
}));

const consoleFetchMock = coFetchModule.consoleFetch as jest.Mock;

describe('SinkResources', () => {
  beforeEach(() => {
    consoleFetchMock.mockImplementation(() =>
      Promise.resolve({
        json: () => mockChannelCRDData,
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be able to sink to k8s service', () => {
    const { container } = render(<SinkResources isMoveSink namespace="test" />);
    const resourceDropdownField = container.querySelector('ResourceDropdownField');
    expect(resourceDropdownField).toBeInTheDocument();
  });

  it('should be able to sink to knative service, broker, k8s service and channels', async () => {
    await fetchChannelsCrd();
    const { container } = render(<SinkResources isMoveSink namespace="test" />);
    const resourceDropdownField = container.querySelector('ResourceDropdownField');
    expect(resourceDropdownField).toBeInTheDocument();
  });
});
