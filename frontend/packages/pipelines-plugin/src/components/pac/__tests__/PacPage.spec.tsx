import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as Router from 'react-router-dom-v5-compat';
import * as rbacModule from '@console/dynamic-plugin-sdk/src/app/components/utils/rbac';
import * as flagsModule from '@console/dynamic-plugin-sdk/src/utils/flags';
import { ErrorPage404 } from '@console/internal/components/error';
import { LoadingBox, AccessDenied } from '@console/internal/components/utils';
import { sampleSecretData } from '../../../test-data/pac-data';
import * as pacHooks from '../hooks/usePacData';
import PacForm from '../PacForm';
import PacOverview from '../PacOverview';
import PacPage from '../PacPage';

// eslint-disable-next-line no-var
var mockNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => ({
  ...require.requireActual('react-router-dom-v5-compat'),
  useLocation: jest.fn(),
  useParams: jest.fn(),
  useNavigate: () => mockNavigate,
}));

// make jest synchronously run the useEffect inside shallow
jest.spyOn(React, 'useEffect').mockImplementation((f) => f());

describe('PacPage', () => {
  let wrapper: ShallowWrapper;
  let spyUseAccessReview;
  let spyUseFlag;
  let spyPacHooks;

  beforeEach(() => {
    spyUseAccessReview = jest.spyOn(rbacModule, 'useAccessReview');
    spyUseFlag = jest.spyOn(flagsModule, 'useFlag');
    spyPacHooks = jest.spyOn(pacHooks, 'usePacData');

    spyUseAccessReview.mockReturnValue([true, false]);
    spyUseFlag.mockReturnValue(true);
    spyPacHooks.mockReturnValue({ loaded: true, secretData: sampleSecretData, loadError: null });

    jest.spyOn(Router, 'useLocation').mockReturnValue({
      pathname: '/pac/ns/openshift-pipelines',
      search: '',
    });
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'openshift-pipelines',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should call history to redirect if ns is not openshift-pipelines', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'openshift-new',
    });
    wrapper = shallow(<PacPage />);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/pac/ns/openshift-pipelines');
  });

  it('should show 404, if pipeline operator is not installed', () => {
    spyUseFlag.mockReturnValue(false);
    wrapper = shallow(<PacPage />);
    expect(wrapper.find(ErrorPage404).exists()).toBe(true);
  });

  it('should return access denied, if user doesnot have access to create resources in openshift-pipelines', () => {
    spyUseAccessReview.mockReturnValue([false, false]);
    wrapper = shallow(<PacPage />);
    expect(wrapper.find(AccessDenied).exists()).toBe(true);
  });

  it('should show loading if resources are still being fetched', () => {
    spyPacHooks.mockReturnValue({ loaded: false, secretData: undefined, loadError: null });
    wrapper = shallow(<PacPage />);
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
  });

  it('should show pac form if no secret exists in openshift-pipelines ns', () => {
    spyPacHooks.mockReturnValue({ loaded: true, secretData: undefined, loadError: null });
    wrapper = shallow(<PacPage />);
    expect(wrapper.find(PacForm).exists()).toBe(true);
  });

  it('should show pac overview if secret exists in openshift-pipelines ns', () => {
    wrapper = shallow(<PacPage />);
    const pacOverviewComp = wrapper.find(PacOverview);
    expect(pacOverviewComp.exists()).toBe(true);
    expect(pacOverviewComp.props().secret).toEqual(sampleSecretData);
  });

  it('should show pac overview in case of any err with retrieving code or creating secret', () => {
    spyPacHooks.mockReturnValue({ loaded: true, secretData: undefined, loadError: 'error' });
    wrapper = shallow(<PacPage />);
    const pacOverviewComp = wrapper.find(PacOverview);
    expect(pacOverviewComp.exists()).toBe(true);
    expect(pacOverviewComp.props().loadError).toEqual('error');
  });
});
