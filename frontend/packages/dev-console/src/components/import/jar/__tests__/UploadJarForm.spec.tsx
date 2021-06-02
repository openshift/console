import * as React from 'react';
import { shallow } from 'enzyme';
import { ImageTag } from '@console/dev-console/src/utils/imagestream-utils';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import AdvancedSection from '../../advanced/AdvancedSection';
import AppSection from '../../app/AppSection';
import BuilderImageTagSelector from '../../builder/BuilderImageTagSelector';
import IconSection from '../../section/IconSection';
import ResourceSection from '../../section/ResourceSection';
import JarSection from '../section/JarSection';
import UploadJarForm from '../UploadJarForm';

let UploadJarFormProps: React.ComponentProps<typeof UploadJarForm>;
jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('UploadJarForm', () => {
  beforeEach(() => {
    const tagData: ImageTag = {
      name: 'openjdk-11-el7',
      generation: 2,
      annotations: {},
    };
    UploadJarFormProps = {
      ...formikFormProps,
      values: {
        image: { tag: tagData },
      },
      namespace: 'my-app',
      projects: {
        loaded: true,
        data: [],
        loadError: null,
      },
      builderImage: {
        description: 'Build and run Java applications using Maven and OpenJDK 11.',
        displayName: 'Red Hat OpenJDK',
        iconUrl: 'static/assets/openjdk.svg',
        imageStreamNamespace: 'openshift',
        name: 'java',
        obj: {},
        title: 'Java',
        recentTag: tagData,
        tags: [tagData],
      },
    };
  });

  it('should render form components', () => {
    const wrapper = shallow(<UploadJarForm {...UploadJarFormProps} />);
    expect(wrapper.find(JarSection).exists()).toBe(true);
    expect(wrapper.find(IconSection).exists()).toBe(true);
    expect(wrapper.find(BuilderImageTagSelector).exists()).toBe(true);
    expect(wrapper.find(AppSection).exists()).toBe(true);
    expect(wrapper.find(ResourceSection).exists()).toBe(true);
    expect(wrapper.find(AdvancedSection).exists()).toBe(true);
  });
});
