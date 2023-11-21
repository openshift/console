import * as React from 'react';
import { FileUpload } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import { InputField } from '@console/shared/src';
import JarSection from '../JarSection';

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
  it('should render FileUpload, InputField', () => {
    const wrapper = shallow(<JarSection />);
    expect(wrapper.find(FileUpload).exists()).toBe(true);
    expect(wrapper.find(InputField).exists()).toBe(true);
  });
});
