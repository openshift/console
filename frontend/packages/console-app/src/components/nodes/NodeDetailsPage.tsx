import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceEventStream } from '@console/internal/components/events';
import { DetailsPage } from '@console/internal/components/factory';
import { PodsPage } from '@console/internal/components/pod';
import { navFactory, PageComponentProps } from '@console/internal/components/utils';
import { NodeKind } from '@console/internal/module/k8s';
import { isWindowsNode } from '@console/shared/src/selectors/node';
import { nodeStatus } from '../../status/node';
import { menuActions } from './menu-actions';
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
  const { t } = useTranslation();
  const pagesFor = React.useCallback(
    (node: NodeKind) => [
      {
        href: '',
        name: t('console-app~Overview'),
        component: NodeDashboard,
      },
      {
        href: 'details',
        name: t('console-app~Details'),
        component: NodeDetails,
      },
      navFactory.editYaml(),
      navFactory.pods(NodePodsPage),
      navFactory.logs(NodeLogs),
      navFactory.events(ResourceEventStream),
      ...(!isWindowsNode(node) ? [navFactory.terminal(NodeTerminal)] : []),
    ],
    [t],
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
