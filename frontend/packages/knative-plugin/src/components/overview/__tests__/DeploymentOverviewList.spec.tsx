import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import { revisionObj } from '../../../topology/__tests__/topology-knative-test-data';
import { usePodsForRevisions } from '../../../utils/usePodsForRevisions';
import DeploymentOverviewList from '../DeploymentOverviewList';

type DeploymentOverviewListProps = React.ComponentProps<typeof DeploymentOverviewList>;

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
  let wrapper: ShallowWrapper<DeploymentOverviewListProps>;
  it('should render DeploymentOverviewList with ResourceLink', () => {
    wrapper = shallow(<DeploymentOverviewList resource={revisionObj} />);
    expect(wrapper.find(SidebarSectionHeading)).toHaveLength(1);
    expect(wrapper.find(ResourceLink)).toHaveLength(1);
  });
});
