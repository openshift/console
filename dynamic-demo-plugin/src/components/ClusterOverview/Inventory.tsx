import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MonitoringIcon } from '@patternfly/react-icons';
import {
  K8sResourceCommon,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  OverviewInventoryItem,
  OverviewInventoryItemTitle,
  OverviewInventoryItemBody,
  OverviewInventoryItemStatus,
  OverviewInventoryItemLoading,
} from '@openshift-console/plugin-shared';

const workerNodesLink = '/k8s/cluster/nodes?rowFilter-node-role=worker';

const WorkerNodeInventory: React.FC = () => {
  const { t } = useTranslation("plugin__console-demo-plugin");
  const [nodes, loaded, loadError] = useK8sWatchResource<K8sResourceCommon[]>({
    kind: 'Node',
    isList: true,
  });

  const workerNodes = nodes.filter((node) => node.metadata?.labels?.['node-role.kubernetes.io/worker'] === '');

  let title = <Link to={workerNodesLink}>{t('{{count}} Worker Node', { count: workerNodes.length })}</Link>;
  if (loadError) {
    title = <Link to={workerNodesLink}>{t('Worker Nodes')}</Link>;
  } else if (!loaded) {
    title = <><OverviewInventoryItemLoading /><Link to={workerNodesLink}>{t('Worker Nodes')}</Link></>;
  }

  return (
    <OverviewInventoryItem>
      <OverviewInventoryItemTitle>{title}</OverviewInventoryItemTitle>
      <OverviewInventoryItemBody error={loadError}>
        {loaded && <OverviewInventoryItemStatus count={workerNodes.length} icon={<MonitoringIcon />} />}
      </OverviewInventoryItemBody>
    </OverviewInventoryItem>
  )
};

export default WorkerNodeInventory;
