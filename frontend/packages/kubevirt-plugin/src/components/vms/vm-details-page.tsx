import * as React from 'react';
import { getResource } from 'kubevirt-web-ui-components';
import { navFactory } from '@console/internal/components/utils';
import { ResourceEventStream } from '@console/internal/components/events';
import { DetailsPage } from '@console/internal/components/factory';
import { K8sResourceKindReference } from '@console/internal/module/k8s';
import { PodModel } from '@console/internal/models';
import { VMDisksFirehose } from '../vm-disks';
import { VMNics } from '../vm-nics';
import { VirtualMachineInstanceMigrationModel, VirtualMachineInstanceModel } from '../../models';
import { VMConsoleFirehose } from './vm-console';
import { VMDetailsFirehose } from './vm-details';
import { menuActionsCreator } from './menu-actions';

// import { VmEvents } from './vm-events';

export const VirtualMachinesDetailsPage: React.FC<VirtualMachinesDetailsPageProps> = (props) => {
  const { name, namespace } = props;

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
  ];

  const consolePage = {
    href: 'consoles',
    name: 'Consoles',
    component: VMConsoleFirehose,
  };

  const nicsPage = {
    href: 'nics',
    name: 'Network Interfaces',
    component: VMNics,
  };

  const disksPage = {
    href: 'disks',
    name: 'Disks',
    component: VMDisksFirehose,
  };

  const pages = [
    navFactory.details(VMDetailsFirehose),
    navFactory.editYaml(),
    consolePage,
    navFactory.events(ResourceEventStream),
    nicsPage,
    disksPage,
  ];

  return (
    <DetailsPage {...props} menuActions={menuActionsCreator} pages={pages} resources={resources} />
  );
};

type VirtualMachinesDetailsPageProps = {
  name: string;
  namespace: string;
  kind: K8sResourceKindReference;
  match: any;
};
