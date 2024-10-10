import * as React from 'react';
import { shallow } from 'enzyme';

import { useUserSettings } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import {
  GettingStartedExpandableGrid,
  GettingStartedShowState,
  useGettingStartedShowState,
} from '@console/shared/src/components/getting-started';

import { GettingStartedSection } from '../getting-started-section';

jest.mock('@console/shared/src/hooks/flag', () => ({
  ...require.requireActual('@console/shared/src/hooks/flag'),
  useFlag: jest.fn(),
}));

jest.mock('@console/shared/src/components/getting-started', () => ({
  ...require.requireActual('@console/shared/src/components/getting-started'),
  useGettingStartedShowState: jest.fn(),
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

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

const mockUserSettings = useUserSettings as jest.Mock;

const useFlagMock = useFlag as jest.Mock;
const useGettingStartedShowStateMock = useGettingStartedShowState as jest.Mock;

describe('GettingStartedSection', () => {
  it('should render with three child elements', () => {
    useFlagMock.mockReturnValue(true);
    mockUserSettings.mockReturnValue([true, jest.fn()]);
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.SHOW, jest.fn(), true]);

    const wrapper = shallow(<GettingStartedSection />);

    expect(wrapper.find(GettingStartedExpandableGrid).length).toEqual(1);
    expect(wrapper.find(GettingStartedExpandableGrid).props().children.length).toEqual(3);
  });

  it('should render nothing when useFlag(FLAGS.OPENSHIFT) return false', () => {
    useFlagMock.mockReturnValue(false);
    mockUserSettings.mockReturnValue([true, jest.fn()]);
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.SHOW, jest.fn(), true]);

    const wrapper = shallow(<GettingStartedSection />);

    expect(wrapper.find(GettingStartedExpandableGrid).length).toEqual(0);
  });

  it('should render nothing if user settings hide them', () => {
    useFlagMock.mockReturnValue(true);
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.HIDE, jest.fn(), true]);

    const wrapper = shallow(<GettingStartedSection />);

    expect(wrapper.find(GettingStartedExpandableGrid).length).toEqual(0);
  });
});
