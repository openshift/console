import { shallow } from 'enzyme';
import { useUserSettings } from '@console/shared';
import {
  GettingStartedExpandableGrid,
  GettingStartedShowState,
  useGettingStartedShowState,
} from '@console/shared/src/components/getting-started';
import { useFlag } from '@console/shared/src/hooks/flag';
import { GettingStartedSection } from '../GettingStartedSection';

jest.mock('@console/shared/src/hooks/flag', () => ({
  ...jest.requireActual('@console/shared/src/hooks/flag'),
  useFlag: jest.fn(),
}));

jest.mock('@console/shared/src/components/getting-started', () => ({
  ...jest.requireActual('@console/shared/src/components/getting-started'),
  useGettingStartedShowState: jest.fn(),
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

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

const mockUserSettings = useUserSettings as jest.Mock;

const useFlagMock = useFlag as jest.Mock;
const useGettingStartedShowStateMock = useGettingStartedShowState as jest.Mock;

describe('GettingStartedSection', () => {
  it('should render with three child elements', () => {
    useFlagMock.mockReturnValue(true);
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.SHOW, jest.fn(), true]);
    mockUserSettings.mockReturnValue([true, jest.fn()]);

    const wrapper = shallow(
      <GettingStartedSection userSettingKey="console.projectOverview.gettingStarted" />,
    );

    expect(wrapper.find(GettingStartedExpandableGrid).props().children.length).toEqual(3);
  });

  it('should render nothing when useFlag(FLAGS.OPENSHIFT) return false', () => {
    useFlagMock.mockReturnValue(false);
    mockUserSettings.mockReturnValue([true, jest.fn()]);
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.SHOW, jest.fn(), true]);

    const wrapper = shallow(
      <GettingStartedSection userSettingKey="console.projectOverview.gettingStarted" />,
    );

    expect(wrapper.find(GettingStartedExpandableGrid).length).toEqual(0);
  });

  it('should render nothing if user settings hide them', () => {
    useFlagMock.mockReturnValue(true);
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.HIDE, jest.fn(), true]);

    const wrapper = shallow(
      <GettingStartedSection userSettingKey="console.projectOverview.gettingStarted" />,
    );

    expect(wrapper.find(GettingStartedExpandableGrid).length).toEqual(0);
  });
});
