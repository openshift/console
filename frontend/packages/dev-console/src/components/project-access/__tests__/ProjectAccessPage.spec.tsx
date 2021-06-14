import * as React from 'react';
import { shallow } from 'enzyme';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
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
  it('should render Project Access page', () => {
    window.SERVER_FLAGS.projectAccessClusterRoles = '["edit", "admin", "view"]';
    const projectAccessPageProps: ProjectAccessPageProps = {
      customData: { activeNamespace: 'abc' },
    };
    const projectAccessPageWrapper = shallow(<ProjectAccessPage {...projectAccessPageProps} />);
    expect(projectAccessPageWrapper.find(ProjectAccess).exists()).toBe(true);
  });
});
