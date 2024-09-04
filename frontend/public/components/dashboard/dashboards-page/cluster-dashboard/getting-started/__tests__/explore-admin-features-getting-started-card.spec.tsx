import * as React from 'react';
import { shallow } from 'enzyme';
import { GettingStartedCard } from '@console/shared/src/components/getting-started';

import { ExploreAdminFeaturesGettingStartedCard } from '../explore-admin-features-getting-started-card';

jest.mock('react', () => ({
  ...require.requireActual('react'),
  useLayoutEffect: require.requireActual('react').useEffect,
}));

jest.mock('@console/shared/src', () => ({
  ...require.requireActual('@console/shared/src'),
  useOpenShiftVersion: () => '4.16.0',
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

jest.mock('@console/shared/src/hooks/flag', () => ({
  useFlag: () => false,
}));

describe('ExploreAdminFeaturesGettingStartedCard', () => {
  it('should contain the right static links', () => {
    const wrapper = shallow(<ExploreAdminFeaturesGettingStartedCard />);

    expect(wrapper.find(GettingStartedCard).props().title).toEqual(
      'Explore new features and capabilities',
    );
    expect(wrapper.find(GettingStartedCard).props().links).toContainEqual({
      id: 'openshift-ai',
      title: 'OpenShift AI',
      description: 'Build, deploy, and manage AI-enabled applications.',
      href:
        '/operatorhub/all-namespaces?keyword=openshift+ai&details-item=rhods-operator-redhat-operators-openshift-marketplace',
    });
    expect(wrapper.find(GettingStartedCard).props().moreLink).toEqual({
      id: 'whats-new',
      title: "See what's new in OpenShift 4.16",
      href: 'https://www.openshift.com/learn/whats-new',
      external: true,
    });
  });
});
