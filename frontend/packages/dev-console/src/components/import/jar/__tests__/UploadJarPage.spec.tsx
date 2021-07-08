import * as React from 'react';
import { shallow } from 'enzyme';
import { LoadingBox, PageHeading } from '@console/internal/components/utils';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import UploadJarPage from '../UploadJarPage';

let UploadJarPageProps: React.ComponentProps<typeof UploadJarPage>;

const useK8sWatchResourcesMock = useK8sWatchResources as jest.Mock;

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

describe('UploadJarPage', () => {
  beforeEach(() => {
    UploadJarPageProps = {
      history: null,
      location: {
        pathname: 'upload-jar/ns/jai-test-1',
        search: 'upload-jar/ns/jai-test-1',
        state: null,
        hash: null,
      },
      match: {
        isExact: true,
        path: 'upload-jar/ns/jai-test-1',
        url: 'upload-jar/ns/jai-test-1',
        params: {
          ns: 'openshift',
        },
      },
    };

    useK8sWatchResourcesMock.mockClear();
  });

  it('should render page not LoadingBox', () => {
    useK8sWatchResourcesMock.mockReturnValue({
      imagestream: { data: [], loaded: true },
      projects: { data: [], loaded: true },
    });

    const wrapper = shallow(<UploadJarPage {...UploadJarPageProps} />);
    expect(wrapper.find(PageHeading).exists()).toBe(true);
    expect(wrapper.find(LoadingBox).exists()).toBe(false);
  });

  it('should render LoadingBox not page', () => {
    useK8sWatchResourcesMock.mockReturnValue({
      imagestream: { data: [], loaded: false },
      projects: { data: [], loaded: false },
    });

    const wrapper = shallow(<UploadJarPage {...UploadJarPageProps} />);
    expect(wrapper.find(PageHeading).exists()).toBe(false);
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
  });
});
