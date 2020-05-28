import * as React from 'react';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import InventoryItem, {
  ResourceInventoryItem,
} from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { PodModel, NodeModel } from '@console/internal/models';
import { getNamespace, getName } from '@console/shared/src/selectors/common';
import { getPodStatusGroups } from '@console/shared/src/components/dashboard/inventory-card/utils';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { PodKind } from '@console/internal/module/k8s/types';
import { Link } from 'react-router-dom';
import { getHostStorage, getHostNICs, getHostCPU } from '../../../selectors';
import { BareMetalHostModel } from '../../../models';
import { BareMetalHostDashboardContext } from './BareMetalHostDashboardContext';

const PodInventoryItem: React.FC = () => {
  const { node, loaded } = React.useContext(BareMetalHostDashboardContext);
  const nodeName = getName(node);

  const podResource = React.useMemo(
    () =>
      loaded && nodeName
        ? {
            isList: true,
            kind: PodModel.kind,
            fieldSelector: `spec.nodeName=${nodeName}`,
          }
        : null,
    [nodeName, loaded],
  );

  const [pods, podsLoaded, podsError] = useK8sWatchResource<PodKind[]>(podResource);

  if (!nodeName || !loaded) {
    return <InventoryItem title={PodModel.label} count={0} isLoading={!loaded} />;
  }

  const basePath = `${resourcePathFromModel(NodeModel, nodeName)}/pods`;

  return (
    <ResourceInventoryItem
      resources={pods}
      basePath={basePath}
      mapper={getPodStatusGroups}
      kind={PodModel}
      isLoading={!podsLoaded}
      error={!!podsError}
    />
  );
};

const InventoryCard: React.FC = () => {
  const { obj } = React.useContext(BareMetalHostDashboardContext);

  const namespace = getNamespace(obj);
  const hostName = getName(obj);

  const NICTitleComponent = React.useCallback(
    ({ children }) => (
      <Link to={`${resourcePathFromModel(BareMetalHostModel, hostName, namespace)}/nics`}>
        {children}
      </Link>
    ),
    [hostName, namespace],
  );

  const DiskTitleComponent = React.useCallback(
    ({ children }) => (
      <Link to={`${resourcePathFromModel(BareMetalHostModel, hostName, namespace)}/disks`}>
        {children}
      </Link>
    ),
    [hostName, namespace],
  );

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Inventory</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <PodInventoryItem />
        <InventoryItem
          title="Disk"
          isLoading={!obj}
          count={getHostStorage(obj).length}
          TitleComponent={DiskTitleComponent}
        />
        <InventoryItem
          title="NIC"
          isLoading={!obj}
          count={getHostNICs(obj).length}
          TitleComponent={NICTitleComponent}
        />
        <InventoryItem title="CPU" isLoading={!obj} count={getHostCPU(obj).count} />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default InventoryCard;
