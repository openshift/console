import type { FC, ComponentProps } from 'react';
import { useCallback } from 'react';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils/horizontal-nav';
import type { K8sModel, NodeKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { ActionServiceProvider } from '@console/shared/src/components/actions/ActionServiceProvider';
import { ActionMenu } from '@console/shared/src/components/actions/menu/ActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';
import { isWindowsNode } from '@console/shared/src/selectors/node';
import { nodeStatus } from '../../status/node';
import { NodeConfiguration } from './configuration/NodeConfiguration';
import { NodeHealth } from './health/NodeHealth';
import NodeDashboard from './node-dashboard/NodeDashboard';
import NodeDetails from './NodeDetails';
import NodeTerminal from './NodeTerminal';
import { NodeWorkload } from './NodeWorkload';

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

const workloadTab = {
  href: 'workload',
  // t('console-app~Workload')
  nameKey: 'console-app~Workload',
  component: NodeWorkload,
};

const yamlTab = navFactory.editYaml();
const terminalTab = navFactory.terminal(NodeTerminal);

export const NodeDetailsPage: FC<ComponentProps<typeof DetailsPage>> = (props) => {
  const pagesFor = useCallback((node: NodeKind) => {
    const tabs = [overviewTab, detailsTab, configurationTab, healthTab, workloadTab, yamlTab];
    if (!isWindowsNode(node)) {
      tabs.push(terminalTab);
    }
    return tabs;
  }, []);

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
