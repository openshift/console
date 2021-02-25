import * as React from 'react';
import { shallow } from 'enzyme';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { FormFooter } from '@console/shared/src/components/form-utils';
import ImageSearchSection from '@console/dev-console/src/components/import/image-search/ImageSearchSection';
import IconSection from '@console/dev-console/src/components/import/section/IconSection';
import AppSection from '@console/dev-console/src/components/import/app/AppSection';
import AdvancedSection from '@console/dev-console/src/components/import/advanced/AdvancedSection';
import KnatifyForm from '../KnatifyForm';

let knatifyFormProps: React.ComponentProps<typeof KnatifyForm>;

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('KnatifyForm', () => {
  beforeEach(() => {
    knatifyFormProps = {
      ...formikFormProps,
      projects: {
        loaded: true,
        data: [],
      },
    };
  });

  it('should render ImageSearchSection, IconSection, AppSection, AdvancedSection and FormFooter', () => {
    const wrapper = shallow(<KnatifyForm {...knatifyFormProps} />);
    expect(wrapper.find(ImageSearchSection).exists()).toBe(true);
    expect(wrapper.find(IconSection).exists()).toBe(true);
    expect(wrapper.find(AppSection).exists()).toBe(true);
    expect(wrapper.find(AdvancedSection).exists()).toBe(true);
    expect(wrapper.find(FormFooter).exists()).toBe(true);
  });
});
