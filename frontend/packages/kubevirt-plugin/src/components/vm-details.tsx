import * as React from 'react';
import * as _ from 'lodash-es';

import { VmDetails, getName, getNamespace, getResource, DASHES } from 'kubevirt-web-ui-components';

import {
  ResourceLink,
  navFactory,
  LoadingInline,
  NodeLink,
  Firehose,
  StatusBox,
} from '@console/internal/components/utils';

import { PodKind, k8sPatch, k8sGet, K8sResourceKindReference } from '@console/internal/module/k8s';
import { PodModel, ServiceModel, NamespaceModel } from '@console/internal/models';
import { breadcrumbsForOwnerRefs } from '@console/internal/components/utils/breadcrumbs';
import { DetailsPage } from '@console/internal/components/factory';

import { VmKind, VmiKind } from '../types';
import { VirtualMachineInstanceModel, VirtualMachineInstanceMigrationModel } from '../models';

// import { VmEvents } from './vm-events';
// import VmConsolesConnected from '../vmconsoles';
// import { Nic } from '../nic';
// import { Disk } from '../disk';
// import { menuActions } from './menu-actions';

export const VmDetailsFirehose = ({ obj: vm }: { obj: VmKind }) => {
  const { name, namespace } = vm.metadata;

  const vmiRes = getResource(VirtualMachineInstanceModel, {
    name,
    namespace,
    isList: false,
    props: 'vmi',
  });
  vmiRes.optional = true;

  const resources = [
    vmiRes,
    getResource(PodModel, { namespace, prop: 'pods' }),
    getResource(VirtualMachineInstanceMigrationModel, { namespace, prop: 'migrations' }),
    getResource(ServiceModel, { namespace, prop: 'services' }),
  ];

  return (
    <div className="co-m-pane__body">
      <Firehose resources={resources}>
        <VmDetailsConnected vm={vm} />
      </Firehose>
    </div>
  );
};

const podResourceLink = ({ pod }: { pod?: PodKind }) =>
  pod ? (
    <ResourceLink
      kind={PodModel.kind}
      name={getName(pod)}
      namespace={getNamespace(pod)}
      uid={pod.metadata.uid}
    />
  ) : (
    DASHES
  );

const VmDetailsConnected = (props: VmDetailsProps) => {
  const { vm } = props;

  const namespaceResourceLink = () => (
    <ResourceLink kind={NamespaceModel.kind} name={getNamespace(vm)} title={getNamespace(vm)} />
  );

  return (
    <StatusBox data={vm} {...props}>
      <VmDetails
        {...props}
        vm={vm}
        NodeLink={NodeLink}
        NamespaceResourceLink={namespaceResourceLink}
        PodResourceLink={podResourceLink}
        migrations={_.get(props, 'migrations.data')}
        services={_.get(props, 'services.data')}
        pods={_.get(props, 'pods.data')}
        vmi={_.get(props, 'vmi.data')}
        k8sPatch={k8sPatch}
        k8sGet={k8sGet}
        LoadingComponent={LoadingInline}
        ResourceLinkComponent={ResourceLink}
      />
    </StatusBox>
  );
};

/* TODO(mlibra): pages will be transferred one by one in follow-ups
const VmDisk = ({obj: vm}) => <Disk vm={vm} />;
const VmNic = ({obj: vm}) => <Nic vm={vm} />;
*/

export const VirtualMachinesDetailsPage = (props: VirtualMachinesDetailsPageProps) => {
  const { name, namespace } = props;
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
    navFactory.details(VmDetailsFirehose),
    navFactory.editYaml(),
    // consolePage,
    // navFactory.events(VmEvents),
    // nicsPage,
    // disksPage,
  ];

  const breadcrumbsFor = (obj) =>
    breadcrumbsForOwnerRefs(obj).concat({
      name: 'Virtual Machine Details',
      path: props.match.url,
    });

  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={breadcrumbsFor}
      menuActions={undefined /* TODO(mlibra): menuActions */}
      pages={pages}
      resources={[
        getResource(VirtualMachineInstanceModel, { name, namespace, isList: false }),
        getResource(VirtualMachineInstanceMigrationModel, { namespace }),
        getResource(PodModel, { namespace }),
      ]}
    />
  );
};

type VirtualMachinesDetailsPageProps = {
  name: string;
  namespace: string;
  kind: K8sResourceKindReference;
  match: any;
};

type VmDetailsProps = {
  vm: VmKind;
  pods?: PodKind[];
  migrations?: any[];
  vmi?: VmiKind;
};
