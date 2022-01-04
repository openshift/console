import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MonitoringIcon } from '@patternfly/react-icons';
import {
  K8sResourceCommon,
  useK8sWatchResource,
  InventoryItem,
  InventoryItemTitle,
  InventoryItemBody,
  InventoryItemStatus,
  InventoryItemLoading,
} from '@openshift-console/dynamic-plugin-sdk';

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
    title = <><InventoryItemLoading /><Link to={workerNodesLink}>{t('Worker Nodes')}</Link></>;
  }

  return (
    <InventoryItem>
      <InventoryItemTitle>{title}</InventoryItemTitle>
      <InventoryItemBody error={loadError}>
        {loaded && <InventoryItemStatus count={workerNodes.length} icon={<MonitoringIcon />} />}
      </InventoryItemBody>
    </InventoryItem>
  )
};

export default WorkerNodeInventory;
