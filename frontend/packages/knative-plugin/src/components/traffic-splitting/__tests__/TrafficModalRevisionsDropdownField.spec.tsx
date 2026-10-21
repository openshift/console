import { render } from '@testing-library/react';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import TrafficModalRevisionsDropdownField from '../TrafficModalRevisionsDropdownField';

jest.mock('@console/shared', () => ({
  DropdownField: jest.fn(() => null),
}));

jest.mock('formik', () => ({
  useField: jest.fn(() => [{ value: 'overlayimage-tkvz5' }, {}]),
}));

const props = {
  ...formikFormProps,
  revisionItems: {
    'overlayimage-bwpxq': 'overlayimage-bwpxq',
    'overlayimage-n2b7n': 'overlayimage-n2b7n',
  },
};

describe('TrafficModalRevisionsDropdownField', () => {
  it('should render without errors', () => {
    expect(() =>
      render(
        <TrafficModalRevisionsDropdownField
          {...props}
          name="revisionName"
          title="Select Revision"
        />,
      ),
    ).not.toThrow();
  });
});
