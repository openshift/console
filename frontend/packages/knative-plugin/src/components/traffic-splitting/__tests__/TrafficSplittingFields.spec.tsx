import * as React from 'react';
import { shallow } from 'enzyme';
import { MultiColumnField } from '@console/shared';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import {
  mockTrafficData,
  mockRevisionItems,
} from '../../../utils/__mocks__/traffic-splitting-utils-mock';
import TrafficSplittingFields from '../TrafficSplittingFields';
import TrafficModalRevisionsDropdownField from '../TrafficModalRevisionsDropdownField';

const formProps = {
  ...formikFormProps,
  status: { error: 'checkErrorProp' },
  values: { trafficSplitting: mockTrafficData },
  revisionItems: mockRevisionItems,
};

describe('TrafficSplittingFields', () => {
  it('should disable delete row button but not add row button for one value', () => {
    const wrapper = shallow(
      <TrafficSplittingFields
        {...formProps}
        values={{ trafficSplitting: [{ percent: 100, revisionName: 'overlayimage-fdqsf' }] }}
      />,
    );
    expect(
      wrapper
        .find(MultiColumnField)
        .first()
        .props().disableDeleteRow,
    ).toBe(true);
    expect(
      wrapper
        .find(MultiColumnField)
        .first()
        .props().disableAddRow,
    ).toBe(false);
  });

  it('should not disable delete row button or add row button if number of values is more than one but less than total number of revisions', () => {
    const wrapper = shallow(
      <TrafficSplittingFields
        {...formProps}
        values={{
          trafficSplitting: [
            { percent: 50, tag: 'tag-1', revisionName: 'overlayimage-fdqsf' },
            { percent: 50, tag: 'tag-2', revisionName: 'overlayimage-tkvz5' },
          ],
        }}
      />,
    );
    expect(
      wrapper
        .find(MultiColumnField)
        .first()
        .props().disableDeleteRow,
    ).toBe(false);
    expect(
      wrapper
        .find(MultiColumnField)
        .first()
        .props().disableAddRow,
    ).toBe(false);
  });

  it('should disable add button when no. of revisionName fields equals number of revisions', () => {
    const wrapper = shallow(<TrafficSplittingFields {...formProps} />);
    expect(
      wrapper
        .find(MultiColumnField)
        .first()
        .props().disableAddRow,
    ).toBe(true);
  });

  it('should exclude the revisions present in values from dropdown items', () => {
    const wrapper = shallow(
      <TrafficSplittingFields
        {...formProps}
        values={{ trafficSplitting: [{ percent: 100, revisionName: 'overlayimage-fdqsf' }] }}
      />,
    );
    expect(
      wrapper
        .find(TrafficModalRevisionsDropdownField)
        .first()
        .props().revisionItems['overlayimage-fdqsf'],
    ).toBe(undefined);
  });
});
