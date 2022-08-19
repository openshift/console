import * as React from 'react';
import { shallow } from 'enzyme';
import { GettingStartedCard } from '@console/shared/src/components/getting-started';
import { useCanClusterUpgrade } from '@console/shared';

import { ClusterSetupGettingStartedCard } from '../cluster-setup-getting-started-card';
import { useIdentityProviderLink } from '../cluster-setup-identity-provider-link';
import { useAlertReceiverLink } from '../cluster-setup-alert-receiver-link';

jest.mock('react', () => ({
  ...require.requireActual('react'),
  useLayoutEffect: require.requireActual('react').useEffect,
}));

jest.mock('@console/shared/src/hooks/useCanClusterUpgrade', () => ({
  useCanClusterUpgrade: jest.fn(),
}));

jest.mock('../cluster-setup-identity-provider-link', () => ({
  useIdentityProviderLink: jest.fn(),
}));

jest.mock('../cluster-setup-alert-receiver-link', () => ({
  useAlertReceiverLink: jest.fn(),
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

const useCanClusterUpgradeMock = useCanClusterUpgrade as jest.Mock;
const useIdentityProviderLinkMock = useIdentityProviderLink as jest.Mock;
const useAlertReceiverLinkMock = useAlertReceiverLink as jest.Mock;

describe('ClusterSetupGettingStartedCard', () => {
  it('should render links if hooks provide them', () => {
    useCanClusterUpgradeMock.mockReturnValue(true);
    useIdentityProviderLinkMock.mockReturnValue({
      id: 'identity-providers',
      title: 'Add identity providers',
      href: 'cluster',
    });
    useAlertReceiverLinkMock.mockReturnValue({
      id: 'alert-receivers',
      title: 'Configure alert receivers',
      href: '/monitoring/alertmanagerconfig',
    });

    const wrapper = shallow(<ClusterSetupGettingStartedCard />);

    expect(wrapper.find(GettingStartedCard).props().title).toEqual('Set up your cluster');
    expect(wrapper.find(GettingStartedCard).props().links).toEqual([
      {
        id: 'identity-providers',
        title: 'Add identity providers',
        href: 'cluster',
      },
      {
        id: 'alert-receivers',
        title: 'Configure alert receivers',
        href: '/monitoring/alertmanagerconfig',
      },
    ]);
    expect(wrapper.find(GettingStartedCard).props().moreLink).toMatchObject({
      id: 'machine-configuration',
      title: 'View all steps in documentation',
      external: true,
    });
  });

  it('should render nothing if hooks provide no links', () => {
    useIdentityProviderLinkMock.mockReturnValue(null);
    useAlertReceiverLinkMock.mockReturnValue(null);

    const wrapper = shallow(<ClusterSetupGettingStartedCard />);

    expect(wrapper.text()).toEqual('');
  });
});
