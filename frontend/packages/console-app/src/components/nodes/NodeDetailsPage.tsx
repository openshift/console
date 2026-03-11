import type { FC, ComponentProps } from 'react';
import { useCallback } from 'react';
import { FLAG_NODE_MGMT_V1 } from '@console/app/src/consts';
import { ResourceEventStream } from '@console/internal/components/events';
import { DetailsPage } from '@console/internal/components/factory';
import { PodsPage } from '@console/internal/components/pod-list';
import { navFactory } from '@console/internal/components/utils/horizontal-nav';
import type { PageComponentProps } from '@console/internal/components/utils/horizontal-nav';
import type { K8sModel, NodeKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  ActionMenu,
  ActionMenuVariant,
  ActionServiceProvider,
} from '@console/shared/src/components/actions';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { isWindowsNode } from '@console/shared/src/selectors/node';
import { nodeStatus } from '../../status/node';
import { NodeConfiguration } from './configuration/NodeConfiguration';
import { NodeHealth } from './health/NodeHealth';
import NodeDashboard from './node-dashboard/NodeDashboard';
import NodeDetails from './NodeDetails';
import NodeLogs from './NodeLogs';
import NodeTerminal from './NodeTerminal';
import { NodeWorkload } from './NodeWorkload';

const NodePodsPage: FC<PageComponentProps<NodeKind>> = ({ obj }) => (
  <PodsPage
    showTitle={false}
    fieldSelector={`spec.nodeName=${obj.metadata.name}`}
    showNamespaceOverride
  />
);

export const NodeDetailsPage: FC<ComponentProps<typeof DetailsPage>> = (props) => {
  const nodeMgmtV1Enabled = useFlag(FLAG_NODE_MGMT_V1);

  const pagesFor = useCallback(
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
      ...(nodeMgmtV1Enabled
        ? [
            {
              href: 'configuration',
              // t('console-app~Configuration')
              nameKey: 'console-app~Configuration',
              component: NodeConfiguration,
            },
            {
              href: 'health',
              // t('console-app~Health')
              nameKey: 'console-app~Health',
              component: NodeHealth,
            },
            {
              href: 'workload',
              // t('console-app~Workload')
              nameKey: 'console-app~Workload',
              component: NodeWorkload,
            },
            navFactory.editYaml(),
          ]
        : [
            navFactory.editYaml(),
            navFactory.pods(NodePodsPage),
            navFactory.logs(NodeLogs),
            navFactory.events(ResourceEventStream),
          ]),
      ...(!isWindowsNode(node) ? [navFactory.terminal(NodeTerminal)] : []),
    ],
    [nodeMgmtV1Enabled],
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
