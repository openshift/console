import * as React from 'react';
import { shallow } from 'enzyme';
import { Dropdown } from '@console/internal/components/utils';
import DropdownField from '../DropdownField';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

jest.mock('formik', () => ({
  useField: jest.fn(() => [{}, {}]),
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    validateForm: jest.fn(),
  })),
  getFieldId: jest.fn(),
}));
describe('DropdownField', () => {
  it('should pass through autocompleteFilter to Dropdown', () => {
    const filterFn = jest.fn<React.ComponentProps<typeof DropdownField>['autocompleteFilter']>();
    const wrapper = shallow(<DropdownField name="test" items={{}} autocompleteFilter={filterFn} />);
    expect(
      wrapper
        .find(Dropdown)
        .first()
        .props().autocompleteFilter,
    ).toBe(filterFn);
  });
});
