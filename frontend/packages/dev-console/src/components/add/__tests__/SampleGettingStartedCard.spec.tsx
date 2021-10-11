import * as React from 'react';
import { shallow } from 'enzyme';
import { useActiveNamespace } from '@console/shared/src';
import { GettingStartedCard } from '@console/shared/src/components/getting-started';
import CatalogServiceProvider from '../../catalog/service/CatalogServiceProvider';
import { SampleGettingStartedCard } from '../SampleGettingStartedCard';
import { loadingCatalogService, loadedCatalogService } from './SampleGettingStartedCard.data';

jest.mock('@console/shared/src/hooks/useActiveNamespace', () => ({
  useActiveNamespace: jest.fn(),
}));

jest.mock('../../catalog/service/CatalogServiceProvider', () => ({
  default: jest.fn(),
}));

// Workaround because getting-started exports also useGettingStartedShowState
jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

// Workaround because getting-started exports also QuickStartGettingStartedCard
jest.mock(
  '@console/app/src/components/quick-starts/loader/QuickStartsLoader',
  () =>
    function QuickStartsLoaderMock({ children }) {
      return children;
    },
);

const useActiveNamespaceMock = useActiveNamespace as jest.Mock;
const CatalogServiceProviderMock = CatalogServiceProvider as jest.Mock;

afterEach(() => {
  delete window.SERVER_FLAGS.addPage;
});

describe('SampleGettingStartedCard', () => {
  it('should not render when Samples add card is disabled', () => {
    window.SERVER_FLAGS.addPage = '{ "disabledActions": "import-from-samples" }';

    useActiveNamespaceMock.mockReturnValue(['active-namespace']);
    CatalogServiceProviderMock.mockImplementation((props) => props.children(loadedCatalogService));

    const wrapper = shallow(<SampleGettingStartedCard />);

    expect(wrapper.text()).toEqual('');
  });

  it('should render loading links until catalog service is loaded', () => {
    useActiveNamespaceMock.mockReturnValue(['active-namespace']);
    CatalogServiceProviderMock.mockImplementation((props) => props.children(loadingCatalogService));

    const wrapper = shallow(
      <SampleGettingStartedCard featured={['code-with-quarkus', 'java-springboot-basic']} />,
    ).shallow();

    expect(wrapper.find(GettingStartedCard).props().title).toEqual(
      'Create applications using samples',
    );
    expect(wrapper.find(GettingStartedCard).props().links).toEqual([
      { id: 'code-with-quarkus', loading: true },
      { id: 'java-springboot-basic', loading: true },
    ]);
    expect(wrapper.find(GettingStartedCard).props().moreLink).toEqual({
      id: 'all-samples',
      title: 'View all samples',
      href: '/samples/ns/active-namespace',
    });
  });

  it('should render featured links when catalog service is loaded', () => {
    useActiveNamespaceMock.mockReturnValue(['active-namespace']);
    CatalogServiceProviderMock.mockImplementation((props) => props.children(loadedCatalogService));

    const wrapper = shallow(
      <SampleGettingStartedCard featured={['code-with-quarkus', 'java-springboot-basic']} />,
    ).shallow();

    expect(wrapper.find(GettingStartedCard).props().title).toEqual(
      'Create applications using samples',
    );
    expect(wrapper.find(GettingStartedCard).props().links).toEqual([
      {
        id: 'code-with-quarkus',
        title: 'Basic Quarkus',
        href:
          '/import?importType=devfile&formType=sample&devfileName=code-with-quarkus&gitRepo=https://github.com/elsony/devfile-sample-code-with-quarkus.git',
      },
      {
        id: 'java-springboot-basic',
        title: 'Basic Spring Boot',
        href:
          '/import?importType=devfile&formType=sample&devfileName=java-springboot-basic&gitRepo=https://github.com/elsony/devfile-sample-java-springboot-basic.git',
      },
    ]);
    expect(wrapper.find(GettingStartedCard).props().moreLink).toEqual({
      id: 'all-samples',
      title: 'View all samples',
      href: '/samples/ns/active-namespace',
    });
  });

  it('should render first samples when catalog service is loaded without featured links', () => {
    useActiveNamespaceMock.mockReturnValue(['active-namespace']);
    CatalogServiceProviderMock.mockImplementation((props) => props.children(loadedCatalogService));

    const wrapper = shallow(<SampleGettingStartedCard />).shallow();

    expect(wrapper.find(GettingStartedCard).props().title).toEqual(
      'Create applications using samples',
    );
    expect(wrapper.find(GettingStartedCard).props().links).toEqual([
      {
        id: 'Sample-7755a465-a923-4393-a102-9876c110dbb4',
        title: '.NET Core',
        href: '/samples/ns/active-namespace/dotnet/openshift',
      },
      {
        id: 'nodejs-basic',
        title: 'Basic NodeJS',
        href:
          '/import?importType=devfile&formType=sample&devfileName=nodejs-basic&gitRepo=https://github.com/redhat-developer/devfile-sample.git',
      },
    ]);
    expect(wrapper.find(GettingStartedCard).props().moreLink).toEqual({
      id: 'all-samples',
      title: 'View all samples',
      href: '/samples/ns/active-namespace',
    });
  });
});
