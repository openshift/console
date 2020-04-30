import * as React from 'react';
import { shallow } from 'enzyme';
import { MultiColumnField } from '@console/shared';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import {
  mockTrafficData,
  mockRevisionItems,
} from '../../../utils/__mocks__/traffic-splitting-utils-mock';
import TrafficSplittingFields from '../TrafficSplittingFields';

const formProps = {
  ...formikFormProps,
  status: { error: 'checkErrorProp' },
  values: { trafficSplitting: mockTrafficData },
  revisionItems: mockRevisionItems,
};

describe('TrafficSplittingFields', () => {
  it('should disable delete row button for one value', () => {
    const wrapper = shallow(
      <TrafficSplittingFields
        {...formProps}
        revisionItems={{ 'overlayimage-fdqsf': 'overlayimage-fdqsf' }}
        values={{ trafficSplitting: [{ percent: 100, revisionName: 'overlayimage-fdqsf' }] }}
      />,
    );
    expect(
      wrapper
        .find(MultiColumnField)
        .first()
        .props().disableDeleteRow,
    ).toBe(true);
  });

  it('should not disable delete row button for more than one values', () => {
    const wrapper = shallow(<TrafficSplittingFields {...formProps} />);
    expect(
      wrapper
        .find(MultiColumnField)
        .first()
        .props().disableDeleteRow,
    ).toBe(false);
  });
});
