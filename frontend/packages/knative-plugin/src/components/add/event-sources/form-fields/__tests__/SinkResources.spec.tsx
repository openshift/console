import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as coFetch from '@console/internal/co-fetch';
import { ServiceModel } from '@console/internal/models';
import { ResourceDropdownField } from '@console/shared';
import { mockChannelCRDData } from '../../../../../utils/__mocks__/dynamic-channels-crd-mock';
import { fetchChannelsCrd } from '../../../../../utils/fetch-dynamic-eventsources-utils';
import SinkResources from '../SinkResources';

jest.mock('formik', () => ({
  useField: jest.fn(() => [{}, {}]),
  useFormikContext: jest.fn(() => ({
    initialValues: {
      formData: { sink: { name: 'test' } },
    },
  })),
}));

let wrapper: ShallowWrapper<any>;
describe('SinkResources', () => {
  beforeEach(() => {
    jest.spyOn(coFetch, 'coFetch').mockImplementation(() =>
      Promise.resolve({
        json: () => mockChannelCRDData,
      } as any),
    );
  });

  it('should be able to sink to k8s service', () => {
    wrapper = shallow(<SinkResources isMoveSink namespace="test" />);
    const sinkables = wrapper.find(ResourceDropdownField).props().resources;
    expect(sinkables).toHaveLength(3);
    expect(sinkables.filter((r) => r.kind === ServiceModel.kind)).toHaveLength(1);
  });

  it('should be able to sink to knative service, broker, k8s service and channels', async () => {
    await fetchChannelsCrd();
    wrapper = shallow(<SinkResources isMoveSink namespace="test" />);
    const sinkables = wrapper.find(ResourceDropdownField).props().resources;
    expect(sinkables).toHaveLength(6);
  });
});
