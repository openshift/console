/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import * as fuzzy from 'fuzzysearch';

import { K8sKind, k8sList, k8sPatch, K8sResourceKind } from '../../module/k8s';
import { DeploymentModel, DeploymentConfigModel, StatefulSetModel } from '../../models';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { Dropdown, history, ResourceIcon, ResourceName, resourcePathFromModel } from '../utils';
import { RadioInput } from '../radio';

const workloadResourceModels = [ DeploymentModel, DeploymentConfigModel, StatefulSetModel ];
const getContainers = (workload: K8sResourceKind) => _.get(workload, 'spec.template.spec.containers') || [];

export class AddSecretToWorkloadModal extends React.Component<AddSecretToWorkloadModalProps, AddSecretToWorkloadModalState> {
  state = {
    inProgress: false,
    errorMessage: '',
    workloadOptions: {},
    workloadsByUID: {},
    selectedWorkloadUID: '',
    addAs: 'environment',
    prefix: '',
    mountPath: '',
  };

  componentDidMount() {
    const { namespace } = this.props;
    const opts = { ns: namespace };
    Promise.all(workloadResourceModels.map(model => {
      return k8sList(model, opts)
        .catch(err => {
          const errorMessage = err.message;
          this.setState({ errorMessage });
          return [];
        })
        .then((res: K8sResourceKind[]): WorkloadItem[] => res.map(obj => ({ model, obj })));
    })).then((responses) => {
      // TODO: Group by kind.
      const allItems: WorkloadItem[] = _.flatten(responses);
      const workloadsByUID = _.keyBy(allItems, 'obj.metadata.uid');
      const sortedItems = _.orderBy(allItems, ['obj.metadata.name', 'model.kind'], ['asc', 'asc']);
      const workloadOptions = _.reduce(sortedItems, (options, item) => {
        const { name, uid } = item.obj.metadata;
        options[uid] = <ResourceName kind={item.model.kind} name={name} />;
        return options;
      }, {});
      this.setState({workloadOptions, workloadsByUID});
    });
  }

  autocompleteFilter(text, item) {
    return fuzzy(text, item.props.name);
  }

  onWorkloadChange = (selectedWorkloadUID: string) => {
    this.setState({ selectedWorkloadUID });
  }

  handleChange: React.ReactEventHandler<HTMLInputElement> = event => {
    const { name, value } = event.currentTarget;
    this.setState({
      [name]: value,
    } as any);
  }

  onAddAsChange: React.ReactEventHandler<HTMLInputElement> = event => {
    this.setState({
      addAs: event.currentTarget.value,
    });
  }

  getEnvPatches(obj) {
    const { secretName } = this.props;
    const { prefix } = this.state;

    // Add `envFrom` to all containers.
    // TODO: Let use the user pick the container.
    const containers = getContainers(obj);
    return containers.map((container, i) => ({
      path: `/spec/template/spec/containers/${i}/envFrom`,
      op: 'add',
      value: [{
        secretRef: {
          name: secretName,
        },
        prefix,
      }],
    }));
  }

  getVolumePatches(obj) {
    const { secretName } = this.props;
    const { mountPath } = this.state;

    // Add a volume mount to all containers.
    // TODO: Let use the user pick the container.
    const containers = getContainers(obj);
    return containers.map((container, i) => ({
      path: `/spec/template/spec/containers/${i}/volumeMounts`,
      op: 'add',
      value: [{
        name: secretName,
        readOnly: true,
        mountPath,
      }],
    })).concat({
      path: '/spec/template/spec/volumes',
      op: 'add',
      value: [{
        name: secretName,
        secret: { secretName },
      }],
    });
  }

  getPatches(obj) {
    return this.state.addAs === 'environment'
      ? this.getEnvPatches(obj)
      : this.getVolumePatches(obj);
  }

  submit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();

    const { workloadsByUID, selectedWorkloadUID } = this.state;
    if (!selectedWorkloadUID) {
      this.setState({ errorMessage: 'You must select a workload.' });
      return;
    }

    this.setState({ inProgress: true, errorMessage: '' });

    const workload = workloadsByUID[selectedWorkloadUID];
    const { model, obj } = workload;
    const patches = this.getPatches(obj);
    k8sPatch(model, obj, patches).then(() => {
      this.setState({ inProgress: false });
      this.props.close();
      const { name, namespace } = obj.metadata;
      history.push(resourcePathFromModel(model, name, namespace));
    }).catch(({message: errorMessage}) => this.setState({ inProgress: false, errorMessage }));
  }

  render() {
    const { secretName } = this.props;
    const { addAs, workloadOptions, selectedWorkloadUID } = this.state;
    const addAsEnvironment = addAs === 'environment';
    const addAsVolume = addAs === 'volume';
    const selectWorkloadPlaceholder = 'Select a workload';

    return <form onSubmit={this.submit} name="co-add-secret-to-workload" className="co-add-secret-to-workload">
      <ModalTitle>Add Secret to Workload</ModalTitle>
      <ModalBody>
        <p>
          Add all values from <ResourceIcon kind="Secret" />{secretName} to a
          workload as environment variables or a volume.
        </p>
        <div className="form-group">
          <label className="control-label co-required" htmlFor="co-add-secret-to-workload__workload">Add this secret to workload</label>
          <Dropdown
            items={workloadOptions}
            selectedKey={selectedWorkloadUID}
            title={selectWorkloadPlaceholder}
            onChange={this.onWorkloadChange}
            autocompleteFilter={this.autocompleteFilter}
            autocompletePlaceholder={selectWorkloadPlaceholder}
            id="co-add-secret-to-workload__workload"
          />
        </div>
        <fieldset>
          <legend className="co-legend co-required">Add secret as</legend>
          <RadioInput title="Enviroment Variables" name="co-add-secret-to-workload__add-as" id="co-add-secret-to-workload__envvars" value="environment" onChange={this.onAddAsChange} checked={addAsEnvironment} />
          {addAsEnvironment && <div className="co-m-radio-desc">
            <div className="form-group">
              <label htmlFor="co-add-secret-to-workload__prefix">Prefix</label>
              <input className="form-control"
                name="prefix"
                id="co-add-secret-to-workload__prefix"
                placeholder="(optional)"
                type="text"
                onChange={this.handleChange} />
            </div>
          </div>}
          <RadioInput title="Volume" name="co-add-secret-to-workload__add-as" id="co-add-secret-to-workload__volume" value="volume" onChange={this.onAddAsChange} checked={addAsVolume} />
          {addAsVolume && <div className="co-m-radio-desc">
            <div className="form-group">
              <label htmlFor="co-add-secret-to-workload__mountpath" className="co-required">Mount Path</label>
              <input className="form-control"
                name="mountPath"
                id="co-add-secret-to-workload__mountpath"
                type="text"
                onChange={this.handleChange}
                required />
            </div>
          </div>}
        </fieldset>
      </ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText="Save" cancel={this.props.cancel} />
    </form>;
  }
}

export const configureAddSecretToWorkloadModal = createModalLauncher<AddSecretToWorkloadModalProps>(AddSecretToWorkloadModal);

type WorkloadItem = {
  model: K8sKind;
  obj: K8sResourceKind;
};

export type AddSecretToWorkloadModalProps = {
  cancel: (e: Event) => void;
  close: () => void;
  secretName: string;
  namespace: string;
};

export type AddSecretToWorkloadModalState = {
  inProgress: boolean;
  errorMessage: string;
  workloadOptions: {
    [uid: string]: React.ReactNode;
  };
  workloadsByUID: {
    [uid: string]: WorkloadItem;
  };
  selectedWorkloadUID: string;
  addAs: string;
  prefix: string;
  mountPath: string;
};
