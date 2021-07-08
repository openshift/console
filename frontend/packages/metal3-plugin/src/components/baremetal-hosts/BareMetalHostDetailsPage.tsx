import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceEventStream } from '@console/internal/components/events';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory, FirehoseResource } from '@console/internal/components/utils';
import { MachineModel, MachineSetModel, NodeModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { useFlag } from '@console/shared/src/hooks/flag';
import { BMO_ENABLED_FLAG } from '../../features';
import { useMaintenanceCapability } from '../../hooks/useMaintenanceCapability';
import { BareMetalHostModel } from '../../models';
import BareMetalHostDetails from './BareMetalHostDetails';
import BareMetalHostDisks from './BareMetalHostDisks';
import BareMetalHostNICs from './BareMetalHostNICs';
import BareMetalHostDashboard from './dashboard/BareMetalHostDashboard';
import { menuActionsCreator } from './host-menu-actions';

type BareMetalHostDetailsPageProps = {
  namespace: string;
  name: string;
  match: any;
};

const BareMetalHostDetailsPage: React.FC<BareMetalHostDetailsPageProps> = (props) => {
  const { t } = useTranslation();
  const [hasNodeMaintenanceCapability, maintenanceModel] = useMaintenanceCapability();
  const bmoEnabled = useFlag(BMO_ENABLED_FLAG);
  const resources: FirehoseResource[] = [
    {
      kind: referenceForModel(MachineModel),
      namespaced: true,
      isList: true,
      prop: 'machines',
    },
    {
      kind: referenceForModel(MachineSetModel),
      namespaced: true,
      isList: true,
      prop: 'machineSets',
    },
    {
      kind: NodeModel.kind,
      namespaced: false,
      isList: true,
      prop: 'nodes',
    },
  ];

  if (hasNodeMaintenanceCapability) {
    resources.push({
      kind: referenceForModel(maintenanceModel),
      namespaced: false,
      isList: true,
      prop: 'nodeMaintenances',
      optional: true,
    });
  }

  const nicsPage = {
    href: 'nics',
    name: t('metal3-plugin~Network Interfaces'),
    component: BareMetalHostNICs,
  };
  const disksPage = {
    href: 'disks',
    name: t('metal3-plugin~Disks'),
    component: BareMetalHostDisks,
  };
  const dashboardPage = {
    href: '',
    name: t('metal3-plugin~Overview'),
    component: BareMetalHostDashboard,
  };
  const detailsPage = {
    href: 'details',
    name: t('metal3-plugin~Details'),
    component: BareMetalHostDetails,
  };
  return (
    <DetailsPage
      {...props}
      pagesFor={() => [
        dashboardPage,
        detailsPage,
        navFactory.editYaml(),
        nicsPage,
        disksPage,
        navFactory.events(ResourceEventStream),
      ]}
      kind={referenceForModel(BareMetalHostModel)}
      resources={resources}
      menuActions={menuActionsCreator}
      customData={{ hasNodeMaintenanceCapability, maintenanceModel, bmoEnabled, t }}
    />
  );
};
export default BareMetalHostDetailsPage;
