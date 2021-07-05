import * as React from 'react';
import { EmptyState } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import ItemSelectorField from '../item-selector-field/ItemSelectorField';

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
}));

describe('ItemSelectorField', () => {
  it('Should not render if showIfSingle is false and list contains single item', () => {
    const list = { ListItem: { name: 'ItemName', title: 'ItemName', iconUrl: 'DisplayIcon' } };
    const wrapper = shallow(<ItemSelectorField name="test" itemList={list} />);
    expect(wrapper.isEmptyRender()).toBe(true);
  });

  it('Should display empty state if list is empty and filter is shown', () => {
    const list = {};
    const wrapper = shallow(<ItemSelectorField name="test" itemList={list} showFilter />);
    expect(wrapper.find(EmptyState)).toHaveLength(1);
  });
});
