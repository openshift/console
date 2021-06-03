import * as React from 'react';
import { shallow } from 'enzyme';
import { GettingStartedCard } from '@console/shared/src/components/getting-started';

import { ExploreAdminFeaturesGettingStartedCard } from '../explore-admin-features-getting-started-card';

jest.mock('react', () => ({
  ...require.requireActual('react'),
  useLayoutEffect: require.requireActual('react').useEffect,
}));

jest.mock('react-i18next', () => ({
  ...require.requireActual('react-i18next'),
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) =>
      key.split('~')[1].replace('{{version}}', params?.version),
  }),
}));

jest.mock('@console/shared/src', () => ({
  ...require.requireActual('@console/shared/src'),
  useOpenShiftVersion: () => '4.8.0',
}));

// Workaround because getting-started exports also RestoreGettingStartedButton
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

describe('ExploreAdminFeaturesGettingStartedCard', () => {
  it('should contain the right static links', () => {
    const wrapper = shallow(<ExploreAdminFeaturesGettingStartedCard />);

    expect(wrapper.find(GettingStartedCard).props().title).toEqual('Explore new admin features');
    expect(wrapper.find(GettingStartedCard).props().links).toEqual([
      {
        id: 'api-explorer',
        title: 'API Explorer',
        href: '/api-explorer',
      },
      {
        id: 'console-customizations',
        title: 'Console customizations',
        href: '/k8s/cluster/customresourcedefinitions?name=console',
      },
    ]);
    expect(wrapper.find(GettingStartedCard).props().moreLink).toEqual({
      id: 'whats-new',
      title: "See what's new in OpenShift 4.8",
      href: 'https://www.openshift.com/learn/whats-new',
      external: true,
    });
  });
});
