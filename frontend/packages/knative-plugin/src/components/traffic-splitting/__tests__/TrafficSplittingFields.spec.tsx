import * as React from 'react';
import { shallow } from 'enzyme';
import { MultiColumnField } from '@console/shared';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import {
  mockTrafficData,
  mockRevisionItems,
} from '../../../utils/__mocks__/traffic-splitting-utils-mock';
import TrafficModalRevisionsDropdownField from '../TrafficModalRevisionsDropdownField';
import TrafficSplittingFields from '../TrafficSplittingFields';

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
    const multiColumnField = wrapper.find(MultiColumnField).first();
    expect(multiColumnField.props().disableDeleteRow).toBe(true);
    expect(multiColumnField.props().tooltipDeleteRow).toBe(
      'Service must have at least one assigned revision',
    );
    expect(multiColumnField.props().disableAddRow).toBe(false);
    expect(multiColumnField.props().tooltipAddRow).toBe(null);
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
    const multiColumnField = wrapper.find(MultiColumnField).first();
    expect(multiColumnField.props().disableDeleteRow).toBe(false);
    expect(multiColumnField.props().tooltipDeleteRow).toBe(undefined);
    expect(multiColumnField.props().disableAddRow).toBe(false);
    expect(multiColumnField.props().tooltipAddRow).toBe(null);
  });

  it('should disable add button when no. of revisionName fields equals number of revisions', () => {
    const wrapper = shallow(<TrafficSplittingFields {...formProps} />);
    const multiColumnField = wrapper.find(MultiColumnField).first();
    expect(multiColumnField.props().disableAddRow).toBe(true);
    expect(multiColumnField.props().tooltipAddRow).toBe(
      'All revisions are already set to receive traffic',
    );
  });

  it('should exclude the revisions present in values from dropdown items', () => {
    const wrapper = shallow(
      <TrafficSplittingFields
        {...formProps}
        values={{ trafficSplitting: [{ percent: 100, revisionName: 'overlayimage-fdqsf' }] }}
      />,
    );
    const trafficModalRevisionsDropdownField = wrapper
      .find(TrafficModalRevisionsDropdownField)
      .first();
    expect(trafficModalRevisionsDropdownField.props().revisionItems['overlayimage-fdqsf']).toBe(
      undefined,
    );
  });
});
