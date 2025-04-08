import * as React from 'react';
import { Card, CardBody, CardHeader, CardTitle, Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { PodModel, NodeModel } from '@console/internal/models';
import { PodKind } from '@console/internal/module/k8s/types';
import InventoryItem, {
  ResourceInventoryItem,
} from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { getPodStatusGroups } from '@console/shared/src/components/dashboard/inventory-card/utils';
import { getNamespace, getName } from '@console/shared/src/selectors/common';
import { BareMetalHostModel } from '../../../models';
import { getHostStorage, getHostNICs, getHostCPU } from '../../../selectors';
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
  const { t } = useTranslation();
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
    <Card>
      <CardHeader>
        <CardTitle>{t('metal3-plugin~Inventory')}</CardTitle>
      </CardHeader>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <PodInventoryItem />
          </StackItem>
          <StackItem>
            <InventoryItem
              title={t('metal3-plugin~Disk')}
              isLoading={!obj}
              count={getHostStorage(obj).length}
              TitleComponent={DiskTitleComponent}
            />
          </StackItem>
          <StackItem>
            <InventoryItem
              title={t('metal3-plugin~NIC')}
              isLoading={!obj}
              count={getHostNICs(obj).length}
              TitleComponent={NICTitleComponent}
            />
          </StackItem>
          <StackItem>
            <InventoryItem
              title={t('metal3-plugin~CPU')}
              isLoading={!obj}
              count={getHostCPU(obj).count}
            />
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};

export default InventoryCard;
