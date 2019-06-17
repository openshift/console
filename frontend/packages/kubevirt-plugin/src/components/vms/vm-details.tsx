import * as React from 'react';
import * as _ from 'lodash-es';

import { getResource, getServicesForVm } from 'kubevirt-web-ui-components';

import {
  navFactory,
  Firehose,
  StatusBox,
  ScrollToTopOnMount,
  SectionHeading,
} from '@console/internal/components/utils';

import { PodKind, K8sResourceKindReference } from '@console/internal/module/k8s';
import { PodModel, ServiceModel } from '@console/internal/models';
import { DetailsPage } from '@console/internal/components/factory';

import { ServicesList } from '@console/internal/components/service';
import { VMKind, VMIKind } from './types';
import { VirtualMachineInstanceModel, VirtualMachineInstanceMigrationModel } from '../../models';
import { VMResourceSummary, VMDetailsList } from './vm-resource';

// import { VmEvents } from './vm-events';
// import VmConsolesConnected from '../vmconsoles';
// import { Nic } from '../nic';
// import { Disk } from '../disk';
// import { menuActions } from './menu-actions';

const VMDetailsFirehose = ({ obj: vm }: { obj: VMKind }) => {
  const { name, namespace } = vm.metadata;

  const vmiRes = getResource(VirtualMachineInstanceModel, {
    name,
    namespace,
    isList: false,
    prop: 'vmi',
    optional: true,
  });

  const resources = [
    vmiRes,
    getResource(PodModel, { namespace, prop: 'pods' }),
    getResource(VirtualMachineInstanceMigrationModel, { namespace, prop: 'migrations' }),
    getResource(ServiceModel, { namespace, prop: 'services' }),
  ];

  return (
    <div className="co-m-pane__body">
      <Firehose resources={resources}>
        <VMDetails vm={vm} />
      </Firehose>
    </div>
  );
};

const VMDetails = (props: VMDetailsProps) => {
  const { vm, ...restProps } = props;
  const flatResources = {
    vm,
    vmi: _.get(props, 'vmi.data'),
    pods: _.get(props, 'pods.data'),
    migrations: _.get(props, 'migrations.data'),
  };

  const vmServicesData = getServicesForVm(_.get(props, 'services', {}).data, vm);

  return (
    <StatusBox data={vm} {...restProps}>
      <ScrollToTopOnMount />
      <div className="co-m-pane__body">
        <SectionHeading text="VM Overview" />
        <div className="row">
          <div className="col-sm-6">
            <VMResourceSummary {...flatResources} />
          </div>
          <div className="col-sm-6">
            <VMDetailsList {...flatResources} />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Services" />
        <ServicesList {...restProps} data={vmServicesData} />
      </div>
    </StatusBox>
  );
};

export const VirtualMachinesDetailsPage = (props: VirtualMachinesDetailsPageProps) => {
  /* TODO(mlibra): pages will be transferred one by one in follow-ups
  const consolePage = {
    href: 'consoles',
    name: 'Consoles',
    component: VmConsolesConnected,
  };

  const nicsPage = {
    href: 'nics',
    name: 'Network Interfaces',
    component: VmNic,
  };

  const disksPage = {
    href: 'disks',
    name: 'Disks',
    component: VmDisk,
  };
  */

  const pages = [
    navFactory.details(VMDetailsFirehose),
    navFactory.editYaml(),
    // consolePage,
    // navFactory.events(VmEvents),
    // nicsPage,
    // disksPage,
  ];

  const menuActions = undefined; // TODO(mlibra): menuActions

  return <DetailsPage {...props} menuActions={menuActions} pages={pages} />;
};

type VirtualMachinesDetailsPageProps = {
  name: string;
  namespace: string;
  kind: K8sResourceKindReference;
  match: any;
};

type VMDetailsProps = {
  vm: VMKind;
  pods?: PodKind[];
  migrations?: any[];
  vmi?: VMIKind;
};
