import * as React from 'react';
import * as _ from 'lodash';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import InventoryItem, {
  ResourceInventoryItem,
} from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { PodModel, NodeModel } from '@console/internal/models';
import { getNamespace, getMachineNodeName, getName } from '@console/shared';
import { getPodStatusGroups } from '@console/shared/src/components/dashboard/inventory-card/utils';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { Link } from 'react-router-dom';
import { getHostStorage, getHostNICs, getHostCPU } from '../../../selectors';
import { BareMetalHostModel } from '../../../models';
import { BareMetalHostDashboardContext } from './BareMetalHostDashboardContext';

const PodInventoryItem = React.memo(
  withDashboardResources(
    ({ nodeName, resources, watchK8sResource, stopWatchK8sResource }: PodInventoryItemProps) => {
      React.useEffect(() => {
        if (!nodeName) {
          return () => {};
        }
        const podResource = {
          isList: true,
          kind: PodModel.kind,
          prop: 'pods',
          fieldSelector: `spec.nodeName=${nodeName}`,
        };
        watchK8sResource(podResource);
        return () => stopWatchK8sResource(podResource);
      }, [nodeName, watchK8sResource, stopWatchK8sResource]);

      const podsData = _.get(resources.pods, 'data', []) as K8sResourceKind[];
      const podsLoaded = _.get(resources.pods, 'loaded');
      const podsError = _.get(resources.pods, 'loadError');

      const basePath = `${resourcePathFromModel(NodeModel, nodeName)}/pods`;

      return (
        <ResourceInventoryItem
          resources={podsData}
          basePath={basePath}
          mapper={getPodStatusGroups}
          kind={PodModel}
          isLoading={!podsLoaded}
          error={!!podsError}
        />
      );
    },
  ),
);

const InventoryCard: React.FC = () => {
  const { obj, machine } = React.useContext(BareMetalHostDashboardContext);

  const namespace = getNamespace(obj);
  const hostName = getName(obj);
  const nodeName = getMachineNodeName(machine);

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
        <PodInventoryItem nodeName={nodeName} />
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

export default withDashboardResources(InventoryCard);

type PodInventoryItemProps = DashboardItemProps & {
  nodeName: string;
};
