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
import { ActionServiceProvider } from '@console/shared/src/components/actions/ActionServiceProvider';
import { ActionMenu } from '@console/shared/src/components/actions/menu/ActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { isWindowsNode } from '@console/shared/src/selectors/node';
import { nodeStatus } from '../../status/node';
import { NodeConfiguration } from './configuration/NodeConfiguration';
import { NodeHealth } from './health/NodeHealth';
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

const overviewTab = {
  href: '',
  // t('console-app~Overview')
  nameKey: 'console-app~Overview',
  component: NodeDashboard,
};

const detailsTab = {
  href: 'details',
  // t('console-app~Details')
  nameKey: 'console-app~Details',
  component: NodeDetails,
};

const configurationTab = {
  href: 'configuration',
  // t('console-app~Configuration')
  nameKey: 'console-app~Configuration',
  component: NodeConfiguration,
};

const healthTab = {
  href: 'health',
  // t('console-app~Health')
  nameKey: 'console-app~Health',
  component: NodeHealth,
};

const yamlTab = navFactory.editYaml();
const podsTab = navFactory.pods(NodePodsPage);
const logsTab = navFactory.logs(NodeLogs);
const eventsTab = navFactory.events(ResourceEventStream);
const terminalTab = navFactory.terminal(NodeTerminal);

export const NodeDetailsPage: FC<ComponentProps<typeof DetailsPage>> = (props) => {
  const nodeMgmtV1Enabled = useFlag(FLAG_NODE_MGMT_V1);

  const pagesFor = useCallback(
    (node: NodeKind) => {
      const tabs = nodeMgmtV1Enabled
        ? [overviewTab, detailsTab, configurationTab, healthTab, yamlTab, podsTab]
        : [overviewTab, detailsTab, yamlTab, podsTab, logsTab, eventsTab];
      if (!isWindowsNode(node)) {
        tabs.push(terminalTab);
      }
      return tabs;
    },
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
