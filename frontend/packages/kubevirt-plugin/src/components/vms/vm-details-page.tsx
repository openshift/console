import * as React from 'react';
import { navFactory } from '@console/internal/components/utils';
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
import { vmMenuActionsCreator } from './menu-actions';
import { VMDashboard } from './vm-dashboard';
import { TEMPLATE_TYPE_LABEL, TEMPLATE_TYPE_VM } from '../../constants/vm';

export const VirtualMachinesDetailsPage: React.FC<VirtualMachinesDetailsPageProps> = (props) => {
  const { name, ns: namespace } = props.match.params;

  const breadcrumbsForVMPage = (match: any) => () => [
    {
      name: VirtualMachineModel.labelPlural,
      path: `/k8s/ns/${match.params.ns || 'default'}/virtualmachines`,
    },
    { name: `${match.params.name} Details`, path: `${match.url}` },
  ];

  const dashboardPage = {
    href: '', // default landing page
    name: 'Overview',
    component: VMDashboard,
  };

  const overviewPage = {
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
    dashboardPage,
    overviewPage,
    navFactory.editYaml(),
    consolePage,
    navFactory.events(VMEvents),
    nicsPage,
    disksPage,
  ];

  const resources = [
    getResource(VirtualMachineInstanceModel, {
      name,
      namespace,
      isList: false,
      prop: 'vmi',
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
      kind={VirtualMachineModel.kind}
      kindObj={VirtualMachineModel}
      menuActions={vmMenuActionsCreator}
      pages={pages}
      resources={resources}
      breadcrumbsFor={breadcrumbsForVMPage(props.match)}
      customData={{ kindObj: VirtualMachineModel }}
    />
  );
};

export type VirtualMachinesDetailsPageProps = {
  match: any;
};
