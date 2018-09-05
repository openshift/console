import * as _ from 'lodash-es';
import React, { Component, Fragment } from 'react';

import { ListHeader, ColHead, List, ListPage, ResourceRow, DetailsPage } from './factory/okdfactory';
import { breadcrumbsForOwnerRefs, Firehose, ResourceLink, navFactory, ResourceCog, Cog } from './utils/okdutils';
import { VirtualMachineInstanceModel, VirtualMachineModel, PodModel, NamespaceModel } from '../models';

import { startStopVmModal } from './modals/start-stop-vm-modal';
import { restartVmModal } from './modals/restart-vm-modal';

const dashes = '---';
const getLabelMatcher = (vm) => _.get(vm, 'spec.template.metadata.labels');

const VMHeader = props => <ListHeader>
  <ColHead {...props} className="col-lg-2 col-md-2 col-sm-2 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 col-sm-2 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 col-sm-2 hidden-xs" sortField="spec.running">State</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 col-sm-2 hidden-xs" sortField="metadata.phase">Phase</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 col-sm-2 hidden-xs">Virtual Machine Instance</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 col-sm-2 hidden-xs">Pod</ColHead>
</ListHeader>;

const getAction = (vm) => {
  return vm.spec.running ? 'Stop Virtual Machine':'Start Virtual Machine';
};

const menuActionStart = (kind, vm) => ({
  label: getAction(vm),
  callback: () => startStopVmModal({
    kind: kind,
    resource: vm,
    start: !vm.spec.running
  })
});

const menuActionRestart = (kind, vm) => ({
  hidden: !_.get(vm, 'spec.running', false),
  label: 'Restart Virtual Machine',
  callback: () => restartVmModal({
    kind: kind,
    resource: vm
  })
});

const menuActions = [menuActionStart, menuActionRestart, Cog.factory.Delete];

const StateColumn = props => {
  if (props.loaded){
    const vm = props.flatten(props.resources);
    if (vm){
      return vm.spec.running ? 'Running':'Stopped';
    }
  }
  return dashes;
};

const PhaseColumn = props => {
  if (props.loaded){
    const vmi = props.flatten(props.resources);
    if (vmi.length > 0) {
      return vmi[0].status.phase;
    }
  }
  return dashes;
};

const FirehoseResourceLink = props => {
  const data = props.flatten(props.resources);
  if (data.length > 0){
    const name = data[0].metadata.name;
    const namespace = data[0].metadata.namespace;
    const title = data[0].metadata.uid;
    const kind = data[0].kind || PodModel.kind;
    return <ResourceLink kind={kind} name={name} namespace={namespace} title={title} />;
  }
  return dashes;
};

const getResourceKind = (kind, namespace, labelMatcher) => {
  let res = { kind:kind, namespaced: true, namespace: namespace, isList: true, prop: kind};
  if (labelMatcher) {
    res = { ...res, selector: {matchLabels:labelMatcher}};
  }
  return [res];
};

const getFlattenForKind = (kind) => {
  return resources => _.get(resources, kind, {}).data;
};

export const VMRow = ({obj: vm}) => {
  const vmResource = [{ kind:VirtualMachineModel.kind, namespaced: true, namespace: vm.metadata.namespace, isList: false, prop: VirtualMachineModel.kind, name: vm.metadata.name}];
  const vmiResources = getResourceKind(VirtualMachineInstanceModel.kind, vm.metadata.namespace, getLabelMatcher(vm));
  const podResources = getResourceKind(PodModel.kind, vm.metadata.namespace, getLabelMatcher(vm));
  return <ResourceRow obj={vm}>
    <div className="col-lg-2 col-md-2 col-sm-2 col-xs-6 co-resource-link-wrapper">
      <ResourceCog actions={menuActions} kind={VirtualMachineModel.kind} resource={vm} />
      <ResourceLink kind={VirtualMachineModel.kind} name={vm.metadata.name} namespace={vm.metadata.namespace} title={vm.metadata.uid} />
    </div>
    <div className="col-lg-2 col-md-2 col-sm-2 col-xs-6 co-break-word">
      <ResourceLink kind={NamespaceModel.kind} name={vm.metadata.namespace} title={vm.metadata.namespace} />
    </div>
    <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">
      <Firehose resources={vmResource} flatten={getFlattenForKind(VirtualMachineModel.kind)}>
        <StateColumn />
      </Firehose>
    </div>
    <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">
      <Firehose resources={vmiResources} flatten={getFlattenForKind(VirtualMachineInstanceModel.kind)}>
        <PhaseColumn />
      </Firehose>
    </div>
    <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">
      <Firehose resources={vmiResources} flatten={getFlattenForKind(VirtualMachineInstanceModel.kind)}>
        <FirehoseResourceLink />
      </Firehose>
    </div>
    <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">
      <Firehose resources={podResources} flatten={getFlattenForKind(PodModel.kind)}>
        <FirehoseResourceLink />
      </Firehose>
    </div>
  </ResourceRow>;
};

const VMStatus = (props) => {
  const vmResource = [{ kind:VirtualMachineModel.kind, namespaced: true, namespace: props.vm.metadata.namespace, isList: false, prop: VirtualMachineModel.kind, name: props.vm.metadata.name}];
  const vmiResources = getResourceKind(VirtualMachineInstanceModel.kind, props.vm.metadata.namespace, getLabelMatcher(props.vm));
  const podResources = getResourceKind(PodModel.kind, props.vm.metadata.namespace, getLabelMatcher(props.vm));
  return <div className="row">
    <div className="col-lg-12">
      <h3 className="overview-section-title">Status</h3>
      <dl className="dl-horizontal dl-left">
        <dt>Name:</dt>
        <dd>{props.vm.metadata.name}</dd>
        <dt>State:</dt>
        <dd>
          <Firehose resources={vmResource} flatten={getFlattenForKind(VirtualMachineModel.kind)}>
            <StateColumn />
          </Firehose>
        </dd>
        <dt>Phase:</dt>
        <dd>
          <Firehose resources={vmiResources} flatten={getFlattenForKind(VirtualMachineInstanceModel.kind)}>
            <PhaseColumn />
          </Firehose>
        </dd>
        <dt>VM Instance:</dt>
        <dd>
          <Firehose resources={vmiResources} flatten={getFlattenForKind(VirtualMachineInstanceModel.kind)}>
            <FirehoseResourceLink />
          </Firehose>
        </dd>
        <dt>Pod:</dt>
        <dd>
          <Firehose resources={podResources} flatten={getFlattenForKind(PodModel.kind)}>
            <FirehoseResourceLink />
          </Firehose>
        </dd>
      </dl>
    </div>
  </div>;
};


class VMResourceConfiguration extends Component {

  getVMConfiguration() {
    const configuration = {};
    const data = this.props.flatten(this.props.resources);
    configuration.cpu = _.get(data[0], 'spec.domain.cpu.cores');
    configuration.memory = _.get(data[0], 'spec.domain.resources.requests.memory');
    //configuration.os = _.get(this.props.vm,'metadata.selector.matchLabels.kubevirt.io/os');
    return configuration;
  }


  render(){
    const configuration = this.getVMConfiguration();
    return <div className="row">
      <div className="col-lg-12">
        <h3 className="overview-section-title">Configuration</h3>
        <dl className="dl-horizontal  dl-left">
          <dt>Memory:</dt>
          <dd>{configuration.memory || dashes}</dd>
          <dt>CPU:</dt>
          <dd>{configuration.cpu || dashes}</dd>
          <dt>Operating System:</dt>
          <dd>{configuration.os || dashes}</dd>
        </dl>
      </div>
    </div>;
  }
}


export const VMList = (props) => <List {...props} Header={VMHeader} Row={VMRow} />;

const Details = ({obj: vm}) => {
  const vmiResources = getResourceKind(VirtualMachineInstanceModel.kind, vm.metadata.namespace, getLabelMatcher(vm));
  return <Fragment>
    <div className="co-m-pane__body">
      <h1 className="co-m-pane__heading">Virtual Machine Overview</h1>
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-lg-6">
            <VMStatus vm={vm} />
          </div>
          <div className="col-lg-6">
            <Firehose resources={vmiResources} flatten={getFlattenForKind(VirtualMachineInstanceModel.kind)}>
              <VMResourceConfiguration vm={vm} />
            </Firehose>
          </div>
        </div>
      </div>
    </div>
  </Fragment>;
};

export const VirtualMachinesDetailsPage = props => <DetailsPage
  {...props}
  breadcrumbsFor={obj => breadcrumbsForOwnerRefs(obj).concat({
    name: 'Virtual Machine Details',
    path: props.match.url,
  })}
  menuActions={menuActions}
  pages={[
    navFactory.details(Details),
    navFactory.editYaml()
  ]}
/>;

export class VirtualMachinesPage extends Component {
  render() {
    return <ListPage
      {...this.props}
      canCreate={true}
      kind={VirtualMachineModel.kind}
      ListComponent={VMList}
    />;
  }

}
