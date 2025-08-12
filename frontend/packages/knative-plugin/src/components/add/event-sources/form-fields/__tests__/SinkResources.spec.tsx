import { render } from '@testing-library/react';
import * as coFetchModule from '@console/dynamic-plugin-sdk/src/utils/fetch/console-fetch';
import { mockChannelCRDData } from '../../../../../utils/__mocks__/dynamic-channels-crd-mock';
import { fetchChannelsCrd } from '../../../../../utils/fetch-dynamic-eventsources-utils';
import SinkResources from '../SinkResources';
import '@testing-library/jest-dom';

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

describe('SinkResources', () => {
  beforeEach(() => {
    jest.spyOn(coFetchModule, 'consoleFetch').mockImplementation(() =>
      Promise.resolve({
        json: () => mockChannelCRDData,
      }),
    );
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
