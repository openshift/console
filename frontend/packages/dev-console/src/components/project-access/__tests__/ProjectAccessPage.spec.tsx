import { shallow } from 'enzyme';
import * as Router from 'react-router-dom';
import { PageHeading } from '@console/internal/components/utils';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import NamespacedPage from '../../NamespacedPage';
import ProjectAccess from '../ProjectAccess';
import ProjectAccessPage from '../ProjectAccessPage';

const useK8sWatchResourcesMock = useK8sWatchResources as jest.Mock;

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

describe('Project Access Page', () => {
  useK8sWatchResourcesMock.mockReturnValue({});
  beforeEach(() => {
    useK8sWatchResourcesMock.mockClear();
  });
  it('should render Project access tab', () => {
    window.SERVER_FLAGS.projectAccessClusterRoles = '["edit", "admin", "view"]';
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'abc',
    });
    jest
      .spyOn(Router, 'useLocation')
      .mockReturnValue({ pathname: '/project-details/ns/abc/access' });
    const projectAccessPageWrapper = shallow(<ProjectAccessPage />);
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
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'abc',
    });
    jest.spyOn(Router, 'useLocation').mockReturnValue({ pathname: '/project-access/ns/abc' });
    const projectAccessPageWrapper = shallow(<ProjectAccessPage />);
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
