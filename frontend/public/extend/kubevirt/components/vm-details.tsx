/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { match } from 'react-router-dom';
import { TEMPLATE_OS_LABEL } from 'kubevirt-web-ui-components';

import { ResourceEventStream } from '../../../components/events';
import { DetailsPage } from '../../../components/factory';
import { Firehose, FirehoseResource, SectionHeading, ResourceLink, ResourceSummary, navFactory } from '../../../components/utils';
import { breadcrumbsForOwnerRefs } from '../../../components/utils/breadcrumbs';
import { VirtualMachineModel, VirtualMachineInstanceModel, PodModel } from '../../../models';
import { referenceForModel } from '../../../module/k8s';

import { menuActions, StateColumn } from './vm-list';
import { getLabelMatcher, findVMI, findPod, getFlattenForKind } from '../module/k8s/vms';
import * as s from '../strings';

const FirehoseResourceLink = (props) => {
  const { loaded, loadError, flatten, filter, resources } = props;
  if (loaded && !loadError) {
    const data = flatten(resources);
    if (data) {
      const resource = filter ? filter(data) : data[0];
      if (resource) {
        const { name, namespace } = resource.metadata;
        const kind = resource.kind || PodModel.kind;
        return <ResourceLink kind={kind} name={name} namespace={namespace} />;
      }
    }
  }
  return <span className="text-muted">{s.notAvailable}</span>;
};

const VMStatus = ({ vm }) => {
  const podResource: FirehoseResource = {
    kind: PodModel.kind,
    prop: PodModel.kind,
    namespaced: true,
    namespace: vm.metadata.namespace,
    selector: { matchLabels: getLabelMatcher(vm) },
    isList: true,
  };

  return <dl className="co-m-pane__details">
    <dt>State</dt>
    <dd>
      <StateColumn vm={vm} />
    </dd>
    <dt>Pod</dt>
    <dd>
      <Firehose resources={[podResource]}>
        <FirehoseResourceLink
          flatten={getFlattenForKind(PodModel.kind)}
          filter={data => findPod(data, vm.metadata.name)} />
      </Firehose>
    </dd>
  </dl>;
};

class VMResourceConfiguration extends React.Component<VMResourceConfigurationProps> {
  _getCpu = (resource) => {
    return this._getFromDomain(resource, ['cpu', 'cores']);
  }

  _getMemory = (resource) => {
    return this._getFromDomain(resource, ['resources', 'requests', 'memory']);
  }

  _getFromDomain = (resource, path) => {
    const domain = ['spec', 'domain'];
    if (resource.kind === VirtualMachineModel.kind) {
      domain.unshift('spec', 'template');
    }
    domain.push(...path);
    return _.get(resource, domain);
  }

  _getVMConfiguration = () => {
    const configuration: any = {};
    const { flatten, resources, filter, vm } = this.props;
    const data = flatten(resources);
    const vmi = filter(data);
    if (vmi) {
      configuration.cpu = this._getCpu(vmi);
      configuration.memory = this._getMemory(vmi);
    } else {
      configuration.cpu = this._getCpu(vm);
      configuration.memory = this._getMemory(vm);
    }
    configuration.os = _.get(vm, ['metadata', 'annotations', TEMPLATE_OS_LABEL]);
    return configuration;
  }

  render() {
    const configuration = this._getVMConfiguration();
    const { memory, cpu, os } = configuration;
    return <dl className="co-m-pane__details">
      <dt>Memory</dt>
      <dd className={classNames({'text-muted': !memory})}>{memory || s.notAvailable}</dd>
      <dt>CPU</dt>
      <dd className={classNames({'text-muted': !cpu})}>{cpu || s.notAvailable}</dd>
      <dt>Operating System</dt>
      <dd className={classNames({'text-muted': !os})}>{os || s.notAvailable}</dd>
    </dl>;
  }
}

const VMDetails = ({ obj: vm }) => {
  const vmiResource: FirehoseResource = {
    kind: referenceForModel(VirtualMachineInstanceModel),
    prop: VirtualMachineInstanceModel.kind,
    name: vm.metadata.name,
    namespaced: true,
    namespace: vm.metadata.namespace,
    selector: { matchLabels: getLabelMatcher(vm) },
    isList: true,
  };

  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Virtual Machine Overview" />
      <div className="row">
        <div className="col-lg-4">
          <ResourceSummary resource={vm} />
        </div>
        <div className="col-lg-4">
          <VMStatus vm={vm} />
        </div>
        <div className="col-lg-4">
          <Firehose resources={[vmiResource]}>
            <VMResourceConfiguration
              flatten={getFlattenForKind(VirtualMachineInstanceModel.kind)}
              filter={data => findVMI(data, vm.metadata.name)}
              vm={vm} />
          </Firehose>
        </div>
      </div>
    </div>
  </React.Fragment>;
};

const VMIEvents = ({ obj: vm }) => {
  const vmi = {
    kind: referenceForModel(VirtualMachineInstanceModel),
    metadata: {
      name: vm.metadata.name,
      namespace: vm.metadata.namespace,
    },
  };
  return <ResourceEventStream obj={vmi} />;
};

export const VirtualMachinesDetailsPage: React.SFC<VirtualMachinesDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    kind={referenceForModel(VirtualMachineModel)}
    breadcrumbsFor={obj => breadcrumbsForOwnerRefs(obj).concat({
      name: 'Virtual Machine Details',
      path: props.match.url,
    })}
    pages={[
      navFactory.details(VMDetails),
      navFactory.editYaml(),
      navFactory.events(VMIEvents),
    ]}
    menuActions={menuActions}
  />
);

type VMResourceConfigurationProps = {
  flatten: (resources: FirehoseResource[]) => {};
  resources?: FirehoseResource[];
  filter: (data: {}) => {};
  vm: {};
};

type VirtualMachinesDetailsPageProps = {
  match: match<any>;
};
