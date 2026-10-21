import { render } from '@testing-library/react';
import { revisionObj } from '../../../topology/__tests__/topology-knative-test-data';
import { usePodsForRevisions } from '../../../utils/usePodsForRevisions';
import DeploymentOverviewList from '../DeploymentOverviewList';

jest.mock('@console/internal/components/utils', () => ({
  ResourceLink: 'ResourceLink',
  SidebarSectionHeading: 'SidebarSectionHeading',
}));

jest.mock('../../../utils/usePodsForRevisions', () => ({
  usePodsForRevisions: jest.fn(),
}));

describe('DeploymentOverviewList', () => {
  (usePodsForRevisions as jest.Mock).mockReturnValue({
    loaded: true,
    loadError: null,
    pods: [
      {
        alerts: {},
        obj: {
          apiVersion: 'apps/v1',
          kind: 'ReplicaSet',
          metadata: {
            annotations: {},
            labels: {
              app: 'nodejs-ex-git-00001',
              'app.kubernetes.io/component': 'nodejs-ex-git',
              'app.kubernetes.io/instance': 'nodejs-ex-git',
              'app.openshift.io/runtime': 'nodejs',
            },
            name: 'nodejs-ex-git-00001-deployment-5876d4bf66',
            namespace: 'deb',
            ownerReferences: [
              {
                apiVersion: 'apps/v1',
                blockOwnerDeletion: true,
                controller: true,
                kind: 'Deployment',
                name: 'nodejs-ex-git-00001-deployment',
                uid: '3d45bcf7-1ad0-4976-91dc-18742e03cf2b',
              },
            ],
          },
        },
      },
    ],
  });

  it('should render DeploymentOverviewList with ResourceLink', () => {
    const { container } = render(<DeploymentOverviewList resource={revisionObj} />);
    expect(container.querySelector('SidebarSectionHeading')).toBeInTheDocument();
    expect(container.querySelector('ResourceLink')).toBeInTheDocument();
  });
});
