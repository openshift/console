import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ResourceEventStream } from '@console/internal/components/events';
import { DetailsPage } from '@console/internal/components/factory';
import { PodsPage } from '@console/internal/components/pod';
import { navFactory, PageComponentProps } from '@console/internal/components/utils';
import { NodeKind } from '@console/internal/module/k8s';
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
  const { editYaml, events, logs, pods } = navFactory;
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
      editYaml(),
      pods(NodePodsPage),
      logs(NodeLogs),
      events(ResourceEventStream),
      ...(!_.some(
        node?.metadata?.labels,
        (v, k) =>
          (k === 'node.openshift.io/os_id' && v === 'Windows') ||
          (k === 'corev1.LabelOSStable' && v === 'windows'),
      )
        ? [{ href: 'terminal', name: t('console-app~Terminal'), component: NodeTerminal }]
        : []),
    ],
    [editYaml, events, logs, pods, t],
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
