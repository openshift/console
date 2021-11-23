import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { FirehoseResource } from '@console/internal/components/utils/types';
import { NodeModel, TemplateModel } from '@console/internal/models/index';
import { K8sResourceKind } from '@console/internal/module/k8s/types';
import { NetworkAttachmentDefinitionModel } from '@console/network-attachment-definition-plugin';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { TEMPLATE_TYPE_BASE, TEMPLATE_TYPE_LABEL, TEMPLATE_TYPE_VM } from '../../../constants';
import { VirtualMachineModel } from '../../../models';
import { kubevirtReferenceForModel } from '../../../models/kubevirtReferenceForModel';
import { ResourcesSection } from './ResourcesSection';
import { VmStatusesSection } from './VmStatusesSection';

import './virt-overview-inventory-card.scss';

const vmResource: FirehoseResource = {
  kind: kubevirtReferenceForModel(VirtualMachineModel),
  namespaced: true,
  isList: true,
  prop: 'vms',
};

const vmTemplatesResource = {
  kind: TemplateModel.kind,
  isList: true,
  prop: 'vmTemplates',
  selector: {
    matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_VM },
  },
};

const vmCommonTemplatesResource = {
  kind: TemplateModel.kind,
  isList: true,
  namespace: 'openshift',
  prop: 'vmCommonTemplates',
  selector: {
    matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_BASE },
  },
};

const nodesResource: FirehoseResource = {
  kind: NodeModel.kind,
  namespaced: false,
  isList: true,
  prop: 'nodes',
};

const nadsResource: FirehoseResource = {
  kind: kubevirtReferenceForModel(NetworkAttachmentDefinitionModel),
  namespaced: false,
  isList: true,
  prop: 'nads',
};

export const InventoryCard: React.FC<DashboardItemProps> = ({
  watchK8sResource,
  stopWatchK8sResource,
  resources,
}) => {
  const { t } = useTranslation();

  React.useEffect(() => {
    watchK8sResource(vmResource);
    watchK8sResource(vmTemplatesResource);
    watchK8sResource(vmCommonTemplatesResource);
    watchK8sResource(nodesResource);
    watchK8sResource(nadsResource);
    return () => {
      stopWatchK8sResource(vmResource);
      stopWatchK8sResource(vmTemplatesResource);
      stopWatchK8sResource(vmCommonTemplatesResource);
      stopWatchK8sResource(nodesResource);
      stopWatchK8sResource(nadsResource);
    };
  }, [watchK8sResource, stopWatchK8sResource]);

  return (
    <DashboardCard data-test-id="kv-running-inventory-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('kubevirt-plugin~Inventory')}</DashboardCardTitle>
      </DashboardCardHeader>
      <div className="kv-inventory-card__body">
        <Grid>
          <GridItem span={4}>
            <div className="kv-inventory-card__item kv-inventory-card__section-header">
              <div className="kv-inventory-card__item-section kv-inventory-card__item--border-right">
                <span className="kv-inventory-card__item-text">
                  {t('kubevirt-plugin~Resources')}
                </span>
              </div>
            </div>
          </GridItem>
          <GridItem span={8}>
            <div className="kv-inventory-card__item kv-inventory-card__section-header">
              <div className="kv-inventory-card__item-section">
                <span className="kv-inventory-card__item-text">
                  {t('kubevirt-plugin~VM statuses')}
                </span>
              </div>
            </div>
          </GridItem>
          <GridItem span={4}>
            <div className="kv-inventory-card__item">
              <div className="kv-inventory-card__item-section kv-inventory-card__item--border-right">
                <span className="kv-inventory-card__item-text">
                  <ResourcesSection resources={resources} />
                </span>
              </div>
            </div>
          </GridItem>
          <GridItem span={8}>
            <VmStatusesSection
              vms={(resources?.vms?.data as K8sResourceKind[]) ?? []}
              vmsLoaded={resources?.vms?.loaded}
            />
          </GridItem>
        </Grid>
      </div>
    </DashboardCard>
  );
};

export const VirtOverviewInventoryCard = withDashboardResources(InventoryCard);
