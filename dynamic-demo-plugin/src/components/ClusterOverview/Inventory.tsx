
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { AddressBookIcon, MonitoringIcon } from '@patternfly/react-icons';
import {
  InventoryItem,
  InventoryItemBody,
  InventoryItemLoading,
  InventoryItemStatus,
  InventoryItemTitle,
  K8sResourceCommon,
  StatusGroupMapper,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';

const workerNodesLink = '/k8s/cluster/nodes?rowFilter-node-role=worker';

// Function declarations so the module factory can initialize the exports
// before the shared module requires complete, regardless of evaluation order.
export default function WorkerNodeInventory() {
  const { t } = useTranslation('plugin__console-demo-plugin');
  const [nodes, loaded, loadError] = useK8sWatchResource<K8sResourceCommon[]>({
    kind: 'Node',
    isList: true,
  });

  const workerNodes = nodes.filter(
    (node) => node.metadata?.labels?.['node-role.kubernetes.io/worker'] === '',
  );

  let title = (
    <Link to={workerNodesLink}>{t('{{count}} Worker Node', { count: workerNodes.length })}</Link>
  );
  if (loadError) {
    title = <Link to={workerNodesLink}>{t('Worker Nodes')}</Link>;
  } else if (!loaded) {
    title = (
      <>
        <InventoryItemLoading />
        <Link to={workerNodesLink}>{t('Worker Nodes')}</Link>
      </>
    );
  }

  return (
    <InventoryItem>
      <InventoryItemTitle>{title}</InventoryItemTitle>
      <InventoryItemBody error={loadError}>
        {loaded && <InventoryItemStatus count={workerNodes.length} icon={<MonitoringIcon />} />}
      </InventoryItemBody>
    </InventoryItem>
  );
}

export function getRouteStatusGroups(resources: Parameters<StatusGroupMapper>[0]) {
  return {
    'demo-inventory-group': {
      statusIDs: ['Accepted'],
      count: resources.length,
      filterType: 'route-status',
    },
  };
}

export function DemoGroupIcon() {
  return <AddressBookIcon />;
}

