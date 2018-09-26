import * as _ from 'lodash-es';
import React, { Component, Fragment } from 'react';

import { ListHeader, ColHead, List, ListPage, ResourceRow, DetailsPage } from './factory/okdfactory';
import { breadcrumbsForOwnerRefs, Firehose, ResourceLink, navFactory, ResourceCog, Cog } from './utils/okdutils';
import { VirtualMachineInstanceModel, VirtualMachineModel, PodModel, NamespaceModel, TemplateModel } from '../models';
import { k8sCreate } from '../../module/k8s';
import actions from '../../module/k8s/k8s-actions';
import { connect } from 'react-redux';

import { startStopVmModal } from './modals/start-stop-vm-modal';
import { restartVmModal } from './modals/restart-vm-modal';

import { CreateVmWizard } from 'kubevirt-web-ui-components/dist/js';

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
  return _.get(vm, 'spec.running', false) ? 'Stop Virtual Machine' : 'Start Virtual Machine';
};

const menuActionStart = (kind, vm) => ({
  label: getAction(vm),
  callback: () => startStopVmModal({
    kind: kind,
    resource: vm,
    start: !_.get(vm, 'spec.running', false)
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
      return _.get(vm, 'spec.running', false) ? 'Running' : 'Stopped';
    }
  }
  return dashes;
};

const PhaseColumn = props => {
  if (props.loaded){
    const resources = props.flatten(props.resources);
    const vmi = props.filter(resources);
    return _.get(vmi, 'status.phase', dashes);
  }
  return dashes;
};

const FirehoseResourceLink = props => {
  if (props.loaded) {
    const data = props.flatten(props.resources);
    if (data) {
      let resource = data[0];
      if (props.filter) {
        resource = props.filter(data);
      }
      if (resource) {
        const name = resource.metadata.name;
        const namespace = resource.metadata.namespace;
        const title = resource.metadata.uid;
        const kind = resource.kind || PodModel.kind;
        return <ResourceLink kind={kind} name={name} namespace={namespace} title={title} />;
      }
    }
  }
  return dashes;
};

const findPod = (data, name) => data.find(p => p.metadata.name.startsWith(`virt-launcher-${name}-`));
const findVMI = (data, name) => data.find(vmi => vmi.metadata.name === name);

const getResourceKind = (kind, namespace, labelMatcher) => {
  let res = { kind:kind, namespaced: true, namespace: namespace, isList: true, prop: kind};
  if (name) {
    res.name = name;
  }
  if (labelMatcher) {
    res.selector = {matchLabels:labelMatcher};
  }
  return [res];
};

const getFlattenForKind = (kind) => {
  return resources => _.get(resources, kind, {}).data;
};

export const VMRow = ({obj: vm}) => {
  const vmResource = [{ kind:VirtualMachineModel.kind, namespaced: true, namespace: vm.metadata.namespace, isList: false, prop: VirtualMachineModel.kind, name: vm.metadata.name}];
  const vmiResources = getResourceKind(VirtualMachineInstanceModel.kind, vm.metadata.namespace, getLabelMatcher(vm), vm.metadata.name);
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
        <PhaseColumn filter={data => findVMI(data, vm.metadata.name)} />
      </Firehose>
    </div>
    <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">
      <Firehose resources={vmiResources} flatten={getFlattenForKind(VirtualMachineInstanceModel.kind)}>
        <FirehoseResourceLink filter={data => findVMI(data, vm.metadata.name)} />
      </Firehose>
    </div>
    <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">
      <Firehose resources={podResources} flatten={getFlattenForKind(PodModel.kind)}>
        <FirehoseResourceLink filter={data => findPod(data, vm.metadata.name)} />
      </Firehose>
    </div>
  </ResourceRow>;
};

const VMStatus = (props) => {
  const vmResource = [{ kind:VirtualMachineModel.kind, namespaced: true, namespace: props.vm.metadata.namespace, isList: false, prop: VirtualMachineModel.kind, name: props.vm.metadata.name}];
  const vmiResources = getResourceKind(VirtualMachineInstanceModel.kind, props.vm.metadata.namespace, getLabelMatcher(props.vm), props.vm.metadata.name);
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
            <PhaseColumn filter={data => findVMI(data, props.vm.metadata.name)} />
          </Firehose>
        </dd>
        <dt>VM Instance:</dt>
        <dd>
          <Firehose resources={vmiResources} flatten={getFlattenForKind(VirtualMachineInstanceModel.kind)}>
            <FirehoseResourceLink filter={data => findVMI(data, props.vm.metadata.name)} />
          </Firehose>
        </dd>
        <dt>Pod:</dt>
        <dd>
          <Firehose resources={podResources} flatten={getFlattenForKind(PodModel.kind)}>
            <FirehoseResourceLink filter={data => findPod(data, props.vm.metadata.name)} />
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

const mapStateToProps = ({k8s}) => ({
  k8s
});

const mapDispatchToProps = () => ({
  stopK8sWatch: actions.stopK8sWatch,
  watchK8sList: actions.watchK8sList
});

const ConnectedNewVMWizard = props => {
  const namespaces = props.flatten(props.resources);
  const templates = _.get(props.resources, TemplateModel.kind, {}).data;
  return <CreateVmWizard
    onHide={props.onHide}
    namespaces={namespaces}
    templates={templates}
    k8sCreate={props.createVm} />;
};

export const VirtualMachinesPage = connect(
  mapStateToProps, mapDispatchToProps)(class VirtualMachinesPage extends Component {

  constructor(props){
    super(props);

    this.state = {
      showWizard: false
    };

    this.createItems = {
      wizard: 'Create with Wizard',
      yaml: 'Create from YAML'
    };

    this.createProps = {
      items: this.createItems,
      createLink: (type) => {
        switch (type) {
          case 'wizard':
            return () => this.setState({showWizard: true});
          default:
            return `/k8s/ns/${this.props.namespace}/virtualmachines/new/`;
        }
      }
    };

    this._onHide = this.onHide.bind(this);
    this._openNewVmWizard = this.openNewVmWizard.bind(this);
  }

  onHide() {
    this.setState({
      showWizard: false
    });
  }

  openNewVmWizard() {
    const resources = [
      { kind:NamespaceModel.kind, isList: true, prop: NamespaceModel.kind},
      { kind:TemplateModel.kind, isList: true, prop: TemplateModel.kind, namespace: 'kubevirt-templates'}
    ];
    return <Firehose resources={resources} flatten={getFlattenForKind(NamespaceModel.kind)}>
      <ConnectedNewVMWizard onHide={this._onHide} createVm={k8sCreate} />
    </Firehose>;
  }

  render() {
    return <React.Fragment>
      {this.state.showWizard ? this._openNewVmWizard() : undefined}
      <ListPage
        {...this.props}
        canCreate={true}
        kind={VirtualMachineModel.kind}
        ListComponent={VMList}
        createProps={this.createProps}
      />;
    </React.Fragment>;
  }
});
