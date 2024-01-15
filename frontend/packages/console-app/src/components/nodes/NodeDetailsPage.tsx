import * as React from 'react';
import { ResourceEventStream } from '@console/internal/components/events';
import { DetailsPage } from '@console/internal/components/factory';
import { PodsPage } from '@console/internal/components/pod';
import { navFactory, PageComponentProps } from '@console/internal/components/utils';
import { K8sModel, NodeKind, referenceForModel } from '@console/internal/module/k8s';
import {
  ActionMenu,
  ActionMenuVariant,
  ActionServiceProvider,
} from '@console/shared/src/components/actions';
import { isWindowsNode } from '@console/shared/src/selectors/node';
import { nodeStatus } from '../../status/node';
import NodeDashboard from './node-dashboard/NodeDashboard';
import NodeDetails from './NodeDetails';
import NodeLogs from './NodeLogs';
import NodeTerminal from './NodeTerminal';

const NodePodsPage: React.FC<PageComponentProps<NodeKind>> = ({ obj }) => (
  <PodsPage
    showTitle={false}
    fieldSelector={`spec.nodeName=${obj.metadata.name}`}
    showNamespaceOverride
  />
);

const NodeDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const pagesFor = React.useCallback(
    (node: NodeKind) => [
      {
        href: '',
        // t('console-app~Overview')
        nameKey: 'console-app~Overview',
        component: NodeDashboard,
      },
      {
        href: 'details',
        // t('console-app~Details')
        nameKey: 'console-app~Details',
        component: NodeDetails,
      },
      navFactory.editYaml(),
      navFactory.pods(NodePodsPage),
      navFactory.logs(NodeLogs),
      navFactory.events(ResourceEventStream),
      ...(!isWindowsNode(node) ? [navFactory.terminal(NodeTerminal)] : []),
    ],
    [],
  );

  const customActionMenu = (kindObj: K8sModel, obj: NodeKind) => {
    const resourceKind = referenceForModel(kindObj);
    const context = { [resourceKind]: obj };
    return (
      <ActionServiceProvider context={context}>
        {({ actions, options, loaded }) =>
          loaded && (
            <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
          )
        }
      </ActionServiceProvider>
    );
  };

  return (
    <DetailsPage
      {...props}
      getResourceStatus={nodeStatus}
      customActionMenu={customActionMenu}
      pagesFor={pagesFor}
    />
  );
};

export default NodeDetailsPage;
