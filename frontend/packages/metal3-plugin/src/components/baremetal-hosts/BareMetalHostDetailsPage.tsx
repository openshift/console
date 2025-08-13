import * as React from 'react';
import { ResourceEventStream } from '@console/internal/components/events';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory, FirehoseResource } from '@console/internal/components/utils';
import { MachineModel, MachineSetModel, NodeModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { ActionServiceProvider, ActionMenu, ActionMenuVariant } from '@console/shared';
import { useMaintenanceCapability } from '../../hooks/useMaintenanceCapability';
import { BareMetalHostModel } from '../../models';
import { BareMetalHostKind } from '../../types';
import BareMetalHostDetails from './BareMetalHostDetails';
import BareMetalHostDisks from './BareMetalHostDisks';
import BareMetalHostNICs from './BareMetalHostNICs';
import BareMetalHostDashboard from './dashboard/BareMetalHostDashboard';

type BareMetalHostDetailsPageProps = {
  namespace: string;
  name: string;
};

const BareMetalHostDetailsPage: React.FC<BareMetalHostDetailsPageProps> = (props) => {
  const [maintenanceModel] = useMaintenanceCapability();
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

  if (maintenanceModel) {
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
    // t('metal3-plugin~Network Interfaces')
    nameKey: 'metal3-plugin~Network Interfaces',
    component: BareMetalHostNICs,
  };
  const disksPage = {
    href: 'disks',
    // t('metal3-plugin~Disks')
    nameKey: 'metal3-plugin~Disks',
    component: BareMetalHostDisks,
  };
  const dashboardPage = {
    href: '',
    // t('metal3-plugin~Overview')
    nameKey: 'metal3-plugin~Overview',
    component: BareMetalHostDashboard,
  };
  const detailsPage = {
    href: 'details',
    // t('metal3-plugin~Details')
    nameKey: 'metal3-plugin~Details',
    component: BareMetalHostDetails,
  };

  const customActionMenu = (_, obj: BareMetalHostKind) => {
    const resourceKind = referenceForModel(BareMetalHostModel);
    const context = { [resourceKind]: obj };
    return (
      <ActionServiceProvider context={context}>
        {({ actions, options, loaded }) =>
          loaded && (
            <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
          )
        }
      </ActionServiceProvider>
    );
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
      customActionMenu={customActionMenu}
    />
  );
};
export default BareMetalHostDetailsPage;
