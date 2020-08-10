import * as React from 'react';
import { shallow } from 'enzyme';
import { DropdownField } from '@console/shared';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import TrafficModalRevisionsDropdownField from '../TrafficModalRevisionsDropdownField';

const props = {
  ...formikFormProps,
  revisionItems: {
    'overlayimage-bwpxq': 'overlayimage-bwpxq',
    'overlayimage-n2b7n': 'overlayimage-n2b7n',
  },
};

jest.mock('formik', () => ({
  useField: jest.fn(() => [{ value: 'overlayimage-tkvz5' }, {}]),
}));

describe('TrafficModalRevisionsDropdownField', () => {
  it('should include the current value of the field in the dropdown items', () => {
    const wrapper = shallow(
      <TrafficModalRevisionsDropdownField {...props} name="revisionName" title="Select Revision" />,
    );
    expect(
      wrapper
        .find(DropdownField)
        .first()
        .props().items,
    ).toHaveProperty('overlayimage-tkvz5', 'overlayimage-tkvz5');
    expect(
      wrapper
        .find(DropdownField)
        .first()
        .props().title,
    ).toBe('overlayimage-tkvz5');
  });
});
