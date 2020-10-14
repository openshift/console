import * as React from 'react';
import * as _ from 'lodash';
import { navFactory } from '@console/internal/components/utils';
import { PodsPage } from '@console/internal/components/pod';
import { ResourceEventStream } from '@console/internal/components/events';
import { NodeKind } from '@console/internal/module/k8s';
import { DetailsPage } from '@console/internal/components/factory';
import { nodeStatus } from '../../status/node';
import NodeDetails from './NodeDetails';
import NodeTerminal from './NodeTerminal';
import { menuActions } from './menu-actions';
import NodeDashboard from './node-dashboard/NodeDashboard';

const NodeDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { editYaml, events, pods } = navFactory;

  const pagesFor = React.useCallback(
    (node: NodeKind) => [
      {
        href: '',
        name: 'Overview',
        component: NodeDashboard,
      },
      {
        href: 'details',
        name: 'Details',
        component: NodeDetails,
      },
      editYaml(),
      pods(({ obj }) => (
        <PodsPage showTitle={false} fieldSelector={`spec.nodeName=${obj.metadata.name}`} />
      )),
      events(ResourceEventStream),
      ...(_.find(
        node?.metadata?.labels,
        (label) =>
          label['corev1.LabelOSStable'] !== 'windows' ||
          label['node.openshift.io/os_id'] !== 'Windows',
      )
        ? [{ href: 'terminal', name: 'Terminal', component: NodeTerminal }]
        : []),
    ],
    [editYaml, events, pods],
  );

  return (
    <DetailsPage
      {...props}
      getResourceStatus={nodeStatus}
      menuActions={menuActions}
      pagesFor={pagesFor}
    />
  );
};

export default NodeDetailsPage;
