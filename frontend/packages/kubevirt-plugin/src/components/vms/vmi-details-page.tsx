import * as React from 'react';
import { navFactory, HintBlock, ExternalLink } from '@console/internal/components/utils';
import { DetailsPage } from '@console/internal/components/factory';
import { PodModel, TemplateModel } from '@console/internal/models';
import { VMDisksFirehose } from '../vm-disks';
import { VMNics } from '../vm-nics';
import {
  VirtualMachineInstanceMigrationModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
} from '../../models';
import { getResource } from '../../utils';
import {
  VM_DETAIL_DETAILS_HREF,
  VM_DETAIL_DISKS_HREF,
  VM_DETAIL_NETWORKS_HREF,
  VM_DETAIL_CONSOLES_HREF,
} from '../../constants';
import { VMEvents } from './vm-events';
import { VMConsoleFirehose } from './vm-console';
import { VMDetailsFirehose } from './vm-details';
import { vmiMenuActionsCreator } from './menu-actions';
import { VMDashboard } from './vm-dashboard';
import { TEMPLATE_TYPE_LABEL, TEMPLATE_TYPE_VM } from '../../constants/vm';
import { breadcrumbsForVMPage } from './vm-details-page';

import './vmi-details-page.scss';

export const VirtualMachinesInstanceDetailsPage: React.FC<VirtualMachinesInstanceDetailsPageProps> = (
  props,
) => {
  const { name, ns: namespace } = props.match.params;

  const overviewPage = {
    href: '', // default landing page
    name: 'Overview',
    component: VMDashboard,
  };

  const detailsPage = {
    href: VM_DETAIL_DETAILS_HREF,
    name: 'Details',
    component: VMDetailsFirehose,
  };

  const consolePage = {
    href: VM_DETAIL_CONSOLES_HREF,
    name: 'Consoles',
    component: VMConsoleFirehose,
  };

  const nicsPage = {
    href: VM_DETAIL_NETWORKS_HREF,
    name: 'Network Interfaces',
    component: VMNics,
  };

  const disksPage = {
    href: VM_DETAIL_DISKS_HREF,
    name: 'Disks',
    component: VMDisksFirehose,
  };

  const pages = [
    overviewPage,
    detailsPage,
    navFactory.editYaml(),
    consolePage,
    navFactory.events(VMEvents),
    nicsPage,
    disksPage,
  ];

  const resources = [
    getResource(VirtualMachineModel, {
      name,
      namespace,
      isList: false,
      prop: 'vm',
      optional: true,
    }),
    getResource(PodModel, { namespace, prop: 'pods' }),
    getResource(VirtualMachineInstanceMigrationModel, { namespace, prop: 'migrations' }),
    getResource(TemplateModel, {
      isList: true,
      namespace,
      prop: 'templates',
      matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_VM },
    }),
  ];

  return (
    <DetailsPage
      {...props}
      name={name}
      namespace={namespace}
      kind={VirtualMachineInstanceModel.kind}
      kindObj={VirtualMachineInstanceModel}
      menuActions={vmiMenuActionsCreator}
      pages={pages}
      resources={resources}
      breadcrumbsFor={breadcrumbsForVMPage(props.match)}
      customData={{ kindObj: VirtualMachineInstanceModel }}
    >
      <HintBlock
        className="kubevirt-details-page__hint-block"
        title={`Virtual Machine Instance ${name}`}
      >
        <p>
          This is a VirtualMachineInstance overview page. Please consider using a VirtualMachine
          that will provide additional management capabilities to a VirtualMachineInstance inside
          the cluster.
        </p>
        <ExternalLink
          href="https://kubevirt.io/user-guide/#/architecture?id=virtualmachine"
          text="Learn more"
        />
      </HintBlock>
    </DetailsPage>
  );
};

export type VirtualMachinesInstanceDetailsPageProps = {
  match: any;
};
