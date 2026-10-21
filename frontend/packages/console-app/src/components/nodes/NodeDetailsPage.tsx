import type { FC, ComponentProps } from 'react';
import { useCallback } from 'react';
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
import { isWindowsNode } from '@console/shared/src/selectors/node';
import { nodeStatus } from '../../status/node';
import NodeDashboard from './node-dashboard/NodeDashboard';
import NodeDetails from './NodeDetails';
import NodeLogs from './NodeLogs';
import NodeTerminal from './NodeTerminal';

const NodePodsPage: FC<PageComponentProps<NodeKind>> = ({ obj }) => (
  <PodsPage
    showTitle={false}
    fieldSelector={`spec.nodeName=${obj.metadata.name}`}
    showNamespaceOverride
  />
);

export const NodeDetailsPage: FC<ComponentProps<typeof DetailsPage>> = (props) => {
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
