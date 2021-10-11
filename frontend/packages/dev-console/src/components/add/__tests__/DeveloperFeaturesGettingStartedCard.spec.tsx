import * as React from 'react';
import { shallow } from 'enzyme';
import { ALL_NAMESPACES_KEY, useActiveNamespace } from '@console/shared/src';
import { GettingStartedCard } from '@console/shared/src/components/getting-started';
import { DeveloperFeaturesGettingStartedCard } from '../DeveloperFeaturesGettingStartedCard';

jest.mock('@console/shared/src', () => ({
  ...require.requireActual('@console/shared/src'),
  useActiveNamespace: jest.fn(),
  useOpenShiftVersion: () => '4.8.0',
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

afterEach(() => {
  delete window.SERVER_FLAGS.addPage;
});

describe('DeveloperFeaturesGettingStartedCard', () => {
  it('should contain links to current active namespace', () => {
    useActiveNamespaceMock.mockReturnValue(['active-namespace']);

    const wrapper = shallow(<DeveloperFeaturesGettingStartedCard />);

    expect(wrapper.find(GettingStartedCard).props().title).toEqual(
      'Explore new developer features',
    );
    expect(wrapper.find(GettingStartedCard).props().links).toEqual([
      {
        id: 'helm-charts',
        title: 'Discover certified Helm Charts',
        href: '/catalog/ns/active-namespace?catalogType=HelmChart',
      },
      {
        id: 'topology',
        title: 'Start building your application quickly in topology',
        href: '/topology/ns/active-namespace?catalogSearch=',
      },
    ]);
    expect(wrapper.find(GettingStartedCard).props().moreLink).toEqual({
      id: 'whats-new',
      title: "What's new in OpenShift 4.8",
      href: 'https://developers.redhat.com/products/openshift/whats-new',
      external: true,
    });
  });

  it('should not show helm link when helm card is disabled', () => {
    window.SERVER_FLAGS.addPage = '{ "disabledActions": "helm" }';

    useActiveNamespaceMock.mockReturnValue(['active-namespace']);

    const wrapper = shallow(<DeveloperFeaturesGettingStartedCard />);

    expect(wrapper.find(GettingStartedCard).props().title).toEqual(
      'Explore new developer features',
    );
    expect(wrapper.find(GettingStartedCard).props().links).toEqual([
      {
        id: 'topology',
        title: 'Start building your application quickly in topology',
        href: '/topology/ns/active-namespace?catalogSearch=',
      },
    ]);
    expect(wrapper.find(GettingStartedCard).props().moreLink).toEqual({
      id: 'whats-new',
      title: "What's new in OpenShift 4.8",
      href: 'https://developers.redhat.com/products/openshift/whats-new',
      external: true,
    });
  });

  it('should contain links without namespace if all namespaces are active', () => {
    useActiveNamespaceMock.mockReturnValue([ALL_NAMESPACES_KEY]);

    const wrapper = shallow(<DeveloperFeaturesGettingStartedCard />);

    expect(wrapper.find(GettingStartedCard).props().title).toEqual(
      'Explore new developer features',
    );
    expect(wrapper.find(GettingStartedCard).props().links).toEqual([
      {
        id: 'helm-charts',
        title: 'Discover certified Helm Charts',
        href: '/catalog/all-namespaces?catalogType=HelmChart',
      },
      {
        id: 'topology',
        title: 'Start building your application quickly in topology',
        href: '/topology/all-namespaces?catalogSearch=',
      },
    ]);
    expect(wrapper.find(GettingStartedCard).props().moreLink).toEqual({
      id: 'whats-new',
      title: "What's new in OpenShift 4.8",
      href: 'https://developers.redhat.com/products/openshift/whats-new',
      external: true,
    });
  });
});
