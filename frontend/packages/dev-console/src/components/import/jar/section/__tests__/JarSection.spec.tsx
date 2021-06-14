import * as React from 'react';
import { shallow } from 'enzyme';
import { FileUploadField, InputField } from '@console/shared/src';
import JarSection from '../JarSection';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

jest.mock('formik', () => ({
  useFormikContext: jest.fn(() => ({
    values: {
      name: '',
      fileUpload: { name: '', value: '' },
      application: { name: '', selectedKey: '' },
    },
    touched: {},
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
  })),
}));

describe('JarSection', () => {
  it('should render FileUploadField, InputField', () => {
    const wrapper = shallow(<JarSection />);
    expect(wrapper.find(FileUploadField).exists()).toBe(true);
    expect(wrapper.find(InputField).exists()).toBe(true);
  });
});
