import * as React from 'react';
import { shallow } from 'enzyme';
import { Formik } from 'formik';
import { LoadingBox, PageHeading } from '@console/internal/components/utils';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { useRelatedHPA } from '@console/shared/src/hooks/hpa-hooks';
import { deploymentData } from '../../../utils/__tests__/knative-serving-data';
import CreateKnatifyPage from '../CreateKnatifyPage';

let createKnatifyPageProps: React.ComponentProps<typeof CreateKnatifyPage>;

const useK8sWatchResourcesMock = useK8sWatchResources as jest.Mock;
const useRelatedHPAMock = useRelatedHPA as jest.Mock;

jest.mock('react-i18next', () => {
  const reactI18Next = require.requireActual('react-i18next');
  return {
    ...reactI18Next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/hpa-hooks', () => ({
  useRelatedHPA: jest.fn(),
}));

describe('CreateKnatifyPage', () => {
  beforeEach(() => {
    createKnatifyPageProps = {
      history: null,
      location: {
        pathname: 'knatify/ns/jai-test-1?name=ruby-ex-git-dc&kind=Deployment',
        search: 'knatify/ns/jai-test-1?name=ruby-ex-git-dc&kind=Deployment',
        state: null,
        hash: null,
      },
      match: {
        isExact: true,
        path: 'knatify/ns/jai-test-1?name=ruby-ex-git-dc&kind=Deployment',
        url: 'knatify/ns/jai-test-1?name=ruby-ex-git-dc&kind=Deployment',
        params: {
          ns: 'openshift',
        },
      },
    };
    useK8sWatchResourcesMock.mockClear();
  });

  it('CreateKnatifyPage should render PageHeading and Loading if resources is not loaded yet', () => {
    useK8sWatchResourcesMock.mockReturnValue({
      imageStream: { data: [], loaded: false },
      projects: { data: [], loaded: false },
      workloadResource: { data: deploymentData, loaded: true },
    });
    useRelatedHPAMock.mockReturnValue([{}, true, null]);
    const wrapper = shallow(<CreateKnatifyPage {...createKnatifyPageProps} />);
    expect(wrapper.find(PageHeading).exists()).toBe(true);
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
    expect(wrapper.find(Formik).exists()).toBe(false);
  });

  it('CreateKnatifyPage should render PageHeading and Loading if Hpa is not loaded', () => {
    useK8sWatchResourcesMock.mockReturnValue({
      imageStream: { data: [], loaded: true },
      projects: { data: [], loaded: true },
      workloadResource: { data: deploymentData, loaded: true },
    });
    useRelatedHPAMock.mockReturnValue([null, false, null]);
    const wrapper = shallow(<CreateKnatifyPage {...createKnatifyPageProps} />);
    expect(wrapper.find(PageHeading).exists()).toBe(true);
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
    expect(wrapper.find(Formik).exists()).toBe(false);
  });

  it('CreateKnatifyPage should render PageHeading and Formik if resources are loaded', () => {
    useK8sWatchResourcesMock.mockReturnValue({
      imageStream: { data: [], loaded: true },
      projects: { data: [], loaded: true },
      workloadResource: { data: deploymentData, loaded: true },
    });
    useRelatedHPAMock.mockReturnValue([{}, true, null]);
    const wrapper = shallow(<CreateKnatifyPage {...createKnatifyPageProps} />);
    expect(wrapper.find(PageHeading).exists()).toBe(true);
    expect(wrapper.find(Formik).exists()).toBe(true);
    expect(wrapper.find(LoadingBox).exists()).toBe(false);
  });
});
