import type { FC } from 'react';
import { useContext } from 'react';
import { DescriptionListDescription, DescriptionListGroup } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import {
  useWatchVirtualMachineInstances,
  VirtualMachineModel,
} from '@console/app/src/components/nodes/utils/NodeVmUtils';
import { useIsKubevirtPluginActive } from '@console/app/src/utils/kubevirt';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { InventoryItem } from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { DescriptionListTermHelp } from '@console/shared/src/components/description-list/DescriptionListTermHelp';
import { NodeDashboardContext } from './NodeDashboardContext';

const VirtualMachinesInventoryItems: FC = () => {
  const { obj } = useContext(NodeDashboardContext);
  const { t } = useTranslation();
  const showVms = useIsKubevirtPluginActive();

  const [vms, vmsLoaded, vmsLoadError] = useWatchVirtualMachineInstances(obj.metadata.name);

  if (!showVms) {
    return null;
  }

  return (
    <DescriptionListGroup>
      <DescriptionListTermHelp
        text={t('console-app~Virtual machines')}
        textHelp={t(
          'console-app~The total shown is based on your access permissions and might not include all virtual machines.',
        )}
      />
      <DescriptionListDescription>
        <Link
          to={`${resourcePathFromModel(VirtualMachineModel)}/search?rowFilter-node=${
            obj.metadata.name
          }`}
        >
          <InventoryItem
            isLoading={!vmsLoaded}
            title={t('console-app~Virtual machine')}
            titlePlural={t('console-app~Virtual machines')}
            count={vms.length}
            error={!!vmsLoadError}
          />
        </Link>
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

export default VirtualMachinesInventoryItems;
