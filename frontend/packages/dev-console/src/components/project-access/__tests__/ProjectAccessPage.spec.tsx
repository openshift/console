import * as React from 'react';
import { shallow } from 'enzyme';
import { PageHeading } from '@console/internal/components/utils';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import NamespacedPage from '../../NamespacedPage';
import ProjectAccess from '../ProjectAccess';
import ProjectAccessPage from '../ProjectAccessPage';

type ProjectAccessPageProps = React.ComponentProps<typeof ProjectAccessPage>;

const useK8sWatchResourcesMock = useK8sWatchResources as jest.Mock;

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

describe('Project Access Page', () => {
  useK8sWatchResourcesMock.mockReturnValue({});
  beforeEach(() => {
    useK8sWatchResourcesMock.mockClear();
  });
  it('should render Project access tab', () => {
    window.SERVER_FLAGS.projectAccessClusterRoles = '["edit", "admin", "view"]';
    const projectAccessPageProps: ProjectAccessPageProps = {
      match: {
        isExact: false,
        path: '/project-details/ns/:ns/access',
        url: '/project-details/ns/abc/access',
        params: {
          ns: 'abc',
        },
      },
    };
    const projectAccessPageWrapper = shallow(<ProjectAccessPage {...projectAccessPageProps} />);
    expect(projectAccessPageWrapper.find(ProjectAccess).exists()).toBe(true);
    expect(
      projectAccessPageWrapper
        .setProps({ roleBindings: { data: [], loaded: true, loadError: null } })
        .find(ProjectAccess)
        .dive()
        .find(PageHeading)
        .props().title,
    ).toEqual(null);
  });

  it('should render Project access full form view', () => {
    window.SERVER_FLAGS.projectAccessClusterRoles = '["edit", "admin", "view"]';
    const projectAccessPageProps: ProjectAccessPageProps = {
      match: {
        isExact: false,
        path: '/project-access/ns/:ns',
        url: '/project-access/ns/abc',
        params: {
          ns: 'abc',
        },
      },
    };
    const projectAccessPageWrapper = shallow(<ProjectAccessPage {...projectAccessPageProps} />);
    expect(
      projectAccessPageWrapper
        .setProps({ roleBindings: { data: [], loaded: true, loadError: null } })
        .find(ProjectAccess)
        .dive()
        .find(NamespacedPage)
        .exists(),
    ).toBe(true);
  });
});
