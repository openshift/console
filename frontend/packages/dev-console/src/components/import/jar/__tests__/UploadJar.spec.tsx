import * as React from 'react';
import { shallow } from 'enzyme';
import { Formik } from 'formik';
import { ImageTag } from '@console/dev-console/src/utils/imagestream-utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import UploadJar from '../UploadJar';

let UploadJarProps: React.ComponentProps<typeof UploadJar>;
const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;
jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/shared/hooks/post-form-submit-action', () => {
  return {
    usePostFormSubmitAction: () => () => {},
  };
});

describe('UploadJar', () => {
  const tagData: ImageTag = {
    name: 'openjdk-11-el7',
    generation: 2,
    annotations: {},
  };
  beforeEach(() => {
    UploadJarProps = {
      namespace: 'my-app',
      projects: {
        data: [],
        loaded: true,
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
    useK8sWatchResourceMock.mockClear();
  });

  it('Should render formik', () => {
    useK8sWatchResourceMock.mockReturnValue([]);
    const wrapper = shallow(<UploadJar {...UploadJarProps} />);
    expect(wrapper.find(Formik).exists()).toBe(true);
  });
});
