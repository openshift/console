import * as React from 'react';
import { shallow } from 'enzyme';
import { GettingStartedCard } from '@console/shared/src/components/getting-started';
import { useActiveNamespace } from '@console/shared/src';

import QuickStartsLoader from '@console/app/src/components/quick-starts/loader/QuickStartsLoader';

import { QuickStartGettingStartedCard } from '../QuickStartGettingStartedCard';
import { loadingQuickStarts, loadedQuickStarts } from './QuickStartGettingStartedCard.data';

jest.mock('react-i18next', () => ({
  ...require.requireActual('react-i18next'),
  useTranslation: () => ({ t: (key) => key.split('~')[1] }),
}));

jest.mock('@console/shared/src/hooks/useActiveNamespace', () => ({
  useActiveNamespace: jest.fn(),
}));

jest.mock('@console/app/src/components/quick-starts/loader/QuickStartsLoader', () => ({
  default: jest.fn(),
}));

// Workaround because getting-started exports also useGettingStartedShowState
jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

const useActiveNamespaceMock = useActiveNamespace as jest.Mock;
const QuickStartsLoaderMock = QuickStartsLoader as jest.Mock;

describe('QuickStartGettingStartedCard', () => {
  it('should render loading links until catalog service is loaded', () => {
    useActiveNamespaceMock.mockReturnValue(['active-namespace']);
    QuickStartsLoaderMock.mockImplementation((props) => props.children(loadingQuickStarts, false));

    const wrapper = shallow(
      <QuickStartGettingStartedCard featured={['quarkus-with-s2i', 'spring-with-s2i']} />,
    ).shallow();

    expect(wrapper.find(GettingStartedCard).props().title).toEqual(
      'Build with guided documentation',
    );
    expect(wrapper.find(GettingStartedCard).props().links).toEqual([
      { id: 'quarkus-with-s2i', loading: true },
      { id: 'spring-with-s2i', loading: true },
    ]);
    expect(wrapper.find(GettingStartedCard).props().moreLink).toEqual({
      id: 'all-quick-starts',
      title: 'View all quick starts',
      href: '/quickstart',
    });
  });

  it('should render featured links when catalog service is loaded', () => {
    useActiveNamespaceMock.mockReturnValue(['active-namespace']);
    QuickStartsLoaderMock.mockImplementation((props) => props.children(loadedQuickStarts, true));

    const wrapper = shallow(
      <QuickStartGettingStartedCard featured={['quarkus-with-s2i', 'spring-with-s2i']} />,
    ).shallow();

    expect(wrapper.find(GettingStartedCard).props().title).toEqual(
      'Build with guided documentation',
    );
    expect(wrapper.find(GettingStartedCard).props().links).toMatchObject([
      {
        id: 'quarkus-with-s2i',
        title: 'Get started with Quarkus using s2i',
        onClick: expect.any(Function),
      },
      {
        id: 'spring-with-s2i',
        title: 'Get started with Spring',
        onClick: expect.any(Function),
      },
    ]);
    expect(wrapper.find(GettingStartedCard).props().moreLink).toEqual({
      id: 'all-quick-starts',
      title: 'View all quick starts',
      href: '/quickstart',
    });
  });

  it('should render first samples when catalog service is loaded without featured links', () => {
    useActiveNamespaceMock.mockReturnValue(['active-namespace']);
    QuickStartsLoaderMock.mockImplementation((props) => props.children(loadedQuickStarts, true));

    const wrapper = shallow(<QuickStartGettingStartedCard />).shallow();

    expect(wrapper.find(GettingStartedCard).props().title).toEqual(
      'Build with guided documentation',
    );
    expect(wrapper.find(GettingStartedCard).props().links).toMatchObject([
      {
        id: 'spring-with-s2i',
        title: 'Get started with Spring',
        onClick: expect.any(Function),
      },
      {
        id: 'monitor-sampleapp',
        title: 'Monitor your sample application',
        onClick: expect.any(Function),
      },
    ]);
    expect(wrapper.find(GettingStartedCard).props().moreLink).toEqual({
      id: 'all-quick-starts',
      title: 'View all quick starts',
      href: '/quickstart',
    });
  });
});
