import type { FC } from 'react';
import { useContext } from 'react';
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import {
  BareMetalHostModel,
  metricsFromBareMetalHosts,
  useIsBareMetalPluginActive,
  useWatchBareMetalHost,
} from '@console/app/src/components/nodes/utils/NodeBareMetalUtils';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { DASH } from '@console/shared/src';
import { InventoryItem } from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { NodeDashboardContext } from './NodeDashboardContext';

type BareMetalInventoryItemsProps = {
  loaded: boolean;
  loadError?: unknown;
  title: string;
  itemsTitle?: string;
  count: number | undefined;
  linkTo?: string;
};

const BareMetalInventoryItem: FC<BareMetalInventoryItemsProps> = ({
  loaded,
  loadError,
  title,
  count,
  linkTo,
}) => {
  return (
    <DescriptionListGroup>
      <DescriptionListTerm>{title}</DescriptionListTerm>
      <DescriptionListDescription>
        {!loaded ? (
          <InventoryItem title={title} isLoading count={0} />
        ) : loadError || count === undefined ? (
          DASH
        ) : linkTo ? (
          <Link to={linkTo}>
            <InventoryItem title={title} isLoading={false} count={count} />
          </Link>
        ) : (
          <InventoryItem title={title} isLoading={false} count={count} />
        )}
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

const BareMetalInventoryItems: FC = () => {
  const { obj } = useContext(NodeDashboardContext);
  const { t } = useTranslation();

  const showBareMetal = useIsBareMetalPluginActive();

  const [bareMetalHost, bareMetalHostLoaded, bareMetalHostLoadError] = useWatchBareMetalHost(obj);

  if (!showBareMetal) {
    return null;
  }

  const { disks, nics, cpus } = metricsFromBareMetalHosts(bareMetalHost);

  return (
    <>
      <BareMetalInventoryItem
        loaded={bareMetalHostLoaded}
        loadError={bareMetalHostLoadError || !bareMetalHost}
        title={t('console-app~Disk')}
        count={disks}
        linkTo={
          bareMetalHost
            ? `${resourcePathFromModel(
                BareMetalHostModel,
                bareMetalHost.metadata.name,
                bareMetalHost.metadata.namespace,
              )}/disks`
            : undefined
        }
      />
      <BareMetalInventoryItem
        loaded={bareMetalHostLoaded}
        loadError={bareMetalHostLoadError || !bareMetalHost}
        title={t('console-app~Network interface')}
        count={nics}
        linkTo={
          bareMetalHost
            ? `${resourcePathFromModel(
                BareMetalHostModel,
                bareMetalHost.metadata.name,
                bareMetalHost.metadata.namespace,
              )}/nics`
            : undefined
        }
      />
      <BareMetalInventoryItem
        loaded={bareMetalHostLoaded}
        loadError={bareMetalHostLoadError || !bareMetalHost}
        title={t('console-app~CPU')}
        count={cpus}
      />
    </>
  );
};

export default BareMetalInventoryItems;
