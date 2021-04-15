import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { testHook } from '../../../../../../__tests__/utils/hooks-utils';
import { useProjectAccessRoles } from '../hooks';
import { defaultAccessRoles } from '../project-access-form-utils';
import { clusterRolesMock } from './cluster-role-mock';

const useK8sWatchResourcesMock = useK8sWatchResources as jest.Mock;

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

describe('project-access hooks', () => {
  it('should return default access roles', () => {
    window.SERVER_FLAGS.projectAccessClusterRoles = undefined;
    const expectedAccessRoles = {
      data: defaultAccessRoles,
      loaded: true,
    };
    useK8sWatchResourcesMock.mockReturnValue({});
    const { result } = testHook(() => useProjectAccessRoles());
    expect(result.current).toEqual(expectedAccessRoles);
  });
  it('should return available cluster roles', () => {
    window.SERVER_FLAGS.projectAccessClusterRoles = '["edit", "admin", "test1"]';
    const expectedAccessRoles = {
      data: { edit: 'edit', admin: 'admin' },
      loaded: true,
    };
    useK8sWatchResourcesMock.mockReturnValue({
      edit: { data: clusterRolesMock[1], loaded: true },
      admin: { data: clusterRolesMock[0], loaded: true },
      test1: { data: {}, loaded: false, loadError: { response: { status: 404 } } },
    });
    const { result } = testHook(() => useProjectAccessRoles());
    expect(result.current).toEqual(expectedAccessRoles);
  });
  it('should not retrun roles if available cluster rules are not present in cluster', () => {
    window.SERVER_FLAGS.projectAccessClusterRoles = '["edisst", "adsssmin"]';
    useK8sWatchResourcesMock.mockReturnValue({
      edisst: { data: {}, loaded: false, loadError: { response: { status: 404 } } },
      adsssmin: { data: {}, loaded: false, loadError: { response: { status: 404 } } },
    });
    const expectedAccessRoles = {
      data: {},
      loaded: true,
    };
    const { result } = testHook(() => useProjectAccessRoles());
    expect(result.current).toEqual(expectedAccessRoles);
  });
  it('should return access roles with name display-name', () => {
    window.SERVER_FLAGS.projectAccessClusterRoles = '["3scale-kourier", "cluster-debugger"]';
    const expectedAccessRoles = {
      data: { '3scale-kourier': '3Scale kourier', 'cluster-debugger': 'Cluster Debugger' },
      loaded: true,
    };
    useK8sWatchResourcesMock.mockReturnValue({
      '3scale-kourier': { data: clusterRolesMock[4], loaded: true },
      'cluster-debugger': { data: clusterRolesMock[5], loaded: true },
    });
    const { result } = testHook(() => useProjectAccessRoles());
    expect(result.current).toEqual(expectedAccessRoles);
  });
  it('should return access role if loadError is other than 404', () => {
    window.SERVER_FLAGS.projectAccessClusterRoles = '["custom-role", "adsssmin"]';
    useK8sWatchResourcesMock.mockReturnValue({
      'custom-role': { data: {}, loaded: false, loadError: { response: { status: 403 } } },
      adsssmin: { data: {}, loaded: false, loadError: { response: { status: 404 } } },
    });
    const expectedAccessRoles = {
      data: { 'custom-role': 'custom-role' },
      loaded: true,
    };
    const { result } = testHook(() => useProjectAccessRoles());
    expect(result.current).toEqual(expectedAccessRoles);
  });
});
