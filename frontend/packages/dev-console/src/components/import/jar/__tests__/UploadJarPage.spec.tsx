import * as React from 'react';
import { shallow } from 'enzyme';
import * as Router from 'react-router-dom-v5-compat';
import { LoadingBox, PageHeading } from '@console/internal/components/utils';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import UploadJarPage from '../UploadJarPage';

const useK8sWatchResourcesMock = useK8sWatchResources as jest.Mock;

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...require.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

describe('UploadJarPage', () => {
  beforeEach(() => {
    useK8sWatchResourcesMock.mockClear();
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'openshift',
    });
    jest.spyOn(Router, 'useLocation').mockReturnValue({
      pathname: 'upload-jar/ns/jai-test-1',
      search: 'upload-jar/ns/jai-test-1',
      state: null,
      hash: null,
    });
  });

  it('should render page not LoadingBox', () => {
    useK8sWatchResourcesMock.mockReturnValue({
      imagestream: { data: [], loaded: true },
      projects: { data: [], loaded: true },
    });

    const wrapper = shallow(<UploadJarPage />);
    expect(wrapper.find(PageHeading).exists()).toBe(true);
    expect(wrapper.find(LoadingBox).exists()).toBe(false);
  });

  it('should render LoadingBox not page', () => {
    useK8sWatchResourcesMock.mockReturnValue({
      imagestream: { data: [], loaded: false },
      projects: { data: [], loaded: false },
    });

    const wrapper = shallow(<UploadJarPage />);
    expect(wrapper.find(PageHeading).exists()).toBe(false);
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
  });
});
