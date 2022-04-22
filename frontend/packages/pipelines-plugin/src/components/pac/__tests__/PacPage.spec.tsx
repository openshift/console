import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as utils from '@console/dynamic-plugin-sdk';
import { ErrorPage404 } from '@console/internal/components/error';
import { LoadingBox, AccessDenied } from '@console/internal/components/utils';
import * as shared from '@console/shared';
import { sampleSecretData } from '../../../test-data/pac-data';
import * as pacHooks from '../hooks/usePacData';
import PacForm from '../PacForm';
import PacOverview from '../PacOverview';
import PacPage from '../PacPage';

const mockHistoryPush = jest.fn();

jest.mock('react-router-dom', () => ({
  ...require.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: '/pac/ns/openshift-pipelines',
    search: '',
  }),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

type PacPageProps = React.ComponentProps<typeof PacPage>;

// make jest synchronously run the useEffect inside shallow
jest.spyOn(React, 'useEffect').mockImplementation((f) => f());

describe('PacPage', () => {
  let wrapper: ShallowWrapper<PacPageProps>;
  let pacPageProps: PacPageProps;
  let spyUseAccessReview;
  let spyUseFlag;
  let spyPacHooks;

  beforeEach(() => {
    spyUseAccessReview = jest.spyOn(utils, 'useAccessReview');
    spyUseFlag = jest.spyOn(shared, 'useFlag');
    spyPacHooks = jest.spyOn(pacHooks, 'usePacData');

    spyUseAccessReview.mockReturnValue([true, false]);
    spyUseFlag.mockReturnValue(true);
    spyPacHooks.mockReturnValue({ loaded: true, secretData: sampleSecretData, loadError: null });
    pacPageProps = {
      match: {
        isExact: true,
        path: '/pac/ns/:ns',
        url: 'pac/ns/openshift-pipelines',
        params: {
          ns: 'openshift-pipelines',
        },
      },
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should call history to redirect if ns is not openshift-pipelines', () => {
    const mockPacPageProps = {
      match: {
        ...pacPageProps.match,
        params: {
          ns: 'openshift-new',
        },
      },
    };
    wrapper = shallow(<PacPage {...mockPacPageProps} />);
    expect(mockHistoryPush).toHaveBeenCalledTimes(1);
    expect(mockHistoryPush).toHaveBeenCalledWith('/pac/ns/openshift-pipelines');
  });

  it('should show 404, if pipeline operator is not installed', () => {
    spyUseFlag.mockReturnValue(false);
    wrapper = shallow(<PacPage {...pacPageProps} />);
    expect(wrapper.find(ErrorPage404).exists()).toBe(true);
  });

  it('should return access denied, if user doesnot have access to create resources in openshift-pipelines', () => {
    spyUseAccessReview.mockReturnValue([false, false]);
    wrapper = shallow(<PacPage {...pacPageProps} />);
    expect(wrapper.find(AccessDenied).exists()).toBe(true);
  });

  it('should show loading if resources are still being fetched', () => {
    spyPacHooks.mockReturnValue({ loaded: false, secretData: undefined, loadError: null });
    wrapper = shallow(<PacPage {...pacPageProps} />);
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
  });

  it('should show pac form if no secret exists in openshift-pipelines ns', () => {
    spyPacHooks.mockReturnValue({ loaded: true, secretData: undefined, loadError: null });
    wrapper = shallow(<PacPage {...pacPageProps} />);
    expect(wrapper.find(PacForm).exists()).toBe(true);
  });

  it('should show pac overview if secret exists in openshift-pipelines ns', () => {
    wrapper = shallow(<PacPage {...pacPageProps} />);
    const pacOverviewComp = wrapper.find(PacOverview);
    expect(pacOverviewComp.exists()).toBe(true);
    expect(pacOverviewComp.props().secret).toEqual(sampleSecretData);
  });

  it('should show pac overview in case of any err with retrieving code or creating secret', () => {
    spyPacHooks.mockReturnValue({ loaded: true, secretData: undefined, loadError: 'error' });
    wrapper = shallow(<PacPage {...pacPageProps} />);
    const pacOverviewComp = wrapper.find(PacOverview);
    expect(pacOverviewComp.exists()).toBe(true);
    expect(pacOverviewComp.props().loadError).toEqual('error');
  });
});
