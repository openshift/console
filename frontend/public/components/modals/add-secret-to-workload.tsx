import * as React from 'react';
import * as _ from 'lodash-es';
import * as fuzzy from 'fuzzysearch';

import { K8sKind, K8sResourceKind, TemplateKind, K8sResourceCommon } from '../../module/k8s/types';
import { DeploymentModel, DeploymentConfigModel, StatefulSetModel } from '../../models';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { Dropdown, history, ResourceIcon, ResourceName, resourcePathFromModel } from '../utils';
import { RadioInput } from '../radio';
import {
  withExtensions,
  AddSecretToVMExtension,
  isAddSecretToVMExtension,
} from '@console/plugin-sdk';
import { getRandomChars, asyncForEach } from '@console/shared/src/utils/utils';
import { k8sList, k8sPatch } from '@console/internal/module/k8s/resource';

const workloadResourceModels = [DeploymentModel, DeploymentConfigModel, StatefulSetModel];
const getContainers = (workload: K8sResourceKind) =>
  _.get(workload, 'spec.template.spec.containers') || [];

const getNewSerialNumber = () =>
  getRandomChars(10)
    .concat(getRandomChars(6))
    .toLocaleUpperCase();

export const AddSecretToWorkloadModal = withExtensions<SecretExtensionProps>({
  secretExtensions: isAddSecretToVMExtension,
})(
  class AddSecretToWorkloadModal extends React.Component<
    AddSecretToWorkloadModalProps & SecretExtensionProps,
    AddSecretToWorkloadModalState
  > {
    state = {
      inProgress: false,
      errorMessage: '',
      workloadOptions: {},
      workloadsByUID: {},
      selectedWorkloadUID: '',
      addAs: 'environment',
      prefix: '',
      mountPath: '',
      serialNumber: '',
      vmTemplate: null,
    };

    componentDidMount() {
      const { namespace } = this.props;
      workloadResourceModels.push(...this.props.secretExtensions.map((s) => s.properties.vmModel));
      const opts = { ns: namespace };
      Promise.all(
        workloadResourceModels.map((model) => {
          return k8sList(model, opts)
            .catch((err) => {
              const errorMessage = err.message;
              this.setState({ errorMessage });
              return [];
            })
            .then((res: K8sResourceKind[]): WorkloadItem[] => res.map((obj) => ({ model, obj })));
        }),
      ).then((responses) => {
        // TODO: Group by kind.
        const allItems: WorkloadItem[] = _.flatten(responses);
        const workloadsByUID = _.keyBy(allItems, 'obj.metadata.uid');
        const sortedItems = _.orderBy(
          allItems,
          ['obj.metadata.name', 'model.kind'],
          ['asc', 'asc'],
        );
        const workloadOptions = _.reduce(
          sortedItems,
          (options, item) => {
            const { name, uid } = item.obj.metadata;
            options[uid] = <ResourceName kind={item.model.kind} name={name} />;
            return options;
          },
          {},
        );
        this.setState({ workloadOptions, workloadsByUID });
      });
    }

    autocompleteFilter(text, item) {
      return fuzzy(text, item.props.name);
    }

    onWorkloadChange = async (selectedWorkloadUID: string) => {
      const { model, obj } = this.state.workloadsByUID[selectedWorkloadUID];
      const isVMWorkload = this.props.secretExtensions.find((s) => s.properties.vmModel === model);
      let vmTemplate = null;
      let serialNumber: string;
      let serialErrMsg: string;

      if (isVMWorkload) {
        serialNumber = await this.getExistingEnvDiskSerial(obj);
        await asyncForEach(this.props.secretExtensions, async (s) => {
          vmTemplate = !vmTemplate ? await s.properties.getTemplateOfVM(obj) : vmTemplate;
        });

        if (serialNumber) {
          serialErrMsg = 'The Secret is already used in this VM';
        } else {
          serialErrMsg = null;
          serialNumber = getNewSerialNumber();
        }
      }

      this.setState({
        selectedWorkloadUID,
        addAs: isVMWorkload
          ? 'disk'
          : this.state.addAs === 'disk'
          ? 'environment'
          : this.state.addAs,
        errorMessage: isVMWorkload && serialErrMsg ? serialErrMsg : '',
        serialNumber: isVMWorkload ? serialNumber : this.state.serialNumber,
        vmTemplate,
      });
    };

    handleChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
      const { name, value } = event.currentTarget;
      this.setState({
        [name]: value,
      } as any);
    };

    onAddAsChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
      this.setState({
        addAs: event.currentTarget.value,
      });
    };

    getExistingEnvDiskSerial = async (vm: K8sResourceCommon): Promise<string> => {
      let serialNumber: Promise<string> = null;
      await asyncForEach(this.props.secretExtensions, async (s) => {
        serialNumber = !serialNumber
          ? await s.properties.getEnvDiskSerial(vm, this.props.secretName)
          : serialNumber;
      });

      return serialNumber;
    };

    getSerialErrorMsg = (serial: string): string =>
      serial && 'This Secret is already configured on the VM';

    getVMEnvDiskPatches = async (vm: K8sResourceCommon) => {
      const vmEnvDiskPatches = [];
      await asyncForEach(this.props.secretExtensions, async (s) => {
        vmEnvDiskPatches.push(
          ...(await s.properties.getVMEnvDiskPatches(
            vm,
            this.props.secretName,
            'secret',
            this.state.serialNumber,
            this.state.vmTemplate,
          )),
        );
      });

      return vmEnvDiskPatches;
    };

    getEnvPatches(obj) {
      const { secretName } = this.props;
      const { prefix } = this.state;
      const envFrom = {
        secretRef: {
          name: secretName,
        },
        prefix,
      };

      // Add `envFrom` to all containers.
      // TODO: Let use the user pick the container.
      const containers = getContainers(obj);
      const patches = containers.map((container, i) => {
        // Create the array if it doesn't exist. Append to the array otherwise.
        const containerPatch = _.isEmpty(container.envFrom)
          ? { op: 'add', path: `/spec/template/spec/containers/${i}/envFrom`, value: [envFrom] }
          : { op: 'add', path: `/spec/template/spec/containers/${i}/envFrom/-`, value: envFrom };
        return containerPatch;
      });

      return patches;
    }

    getVolumePatches(obj) {
      const { secretName } = this.props;
      const { mountPath } = this.state;
      const mount = {
        name: secretName,
        readOnly: true,
        mountPath,
      };

      // Add a volume mount to all containers.
      // TODO: Let use the user pick the container.
      const containers = getContainers(obj);
      const patches = containers.map((container, i) => {
        // Create the array if it doesn't exist. Append to the array otherwise.
        const containerPatch = _.isEmpty(container.volumeMounts)
          ? { op: 'add', path: `/spec/template/spec/containers/${i}/volumeMounts`, value: [mount] }
          : { op: 'add', path: `/spec/template/spec/containers/${i}/volumeMounts/-`, value: mount };
        return containerPatch;
      });

      const volume = {
        name: secretName,
        secret: { secretName },
      };
      const existingVolumes = _.get(obj, 'spec.template.spec.volumes');

      // Create the array if it doesn't exist. Append to the array otherwise.
      const volumePatch = _.isEmpty(existingVolumes)
        ? { op: 'add', path: '/spec/template/spec/volumes', value: [volume] }
        : { op: 'add', path: '/spec/template/spec/volumes/-', value: volume };
      return [...patches, volumePatch];
    }

    getPatches = (obj) => {
      switch (this.state.addAs) {
        case 'environment':
          return this.getEnvPatches(obj);
        case 'volume':
          return this.getVolumePatches(obj);
        case 'disk':
          return this.getVMEnvDiskPatches(obj);
        default:
          return null;
      }
    };

    submit = async (event: React.FormEvent<EventTarget>) => {
      event.preventDefault();

      const { workloadsByUID, selectedWorkloadUID } = this.state;
      if (!selectedWorkloadUID) {
        this.setState({ errorMessage: 'You must select a workload.' });
        return;
      }

      this.setState({ inProgress: true, errorMessage: '' });

      const workload = workloadsByUID[selectedWorkloadUID];
      const { model, obj } = workload;
      const patches = await this.getPatches(obj);
      k8sPatch(model, obj, patches)
        .then(() => {
          this.setState({ inProgress: false });
          this.props.close();
          const { name, namespace } = obj.metadata;
          history.push(resourcePathFromModel(model, name, namespace));
        })
        .catch(({ message: errorMessage }) => this.setState({ inProgress: false, errorMessage }));
    };

    render() {
      const { secretName } = this.props;
      const { addAs, workloadOptions, selectedWorkloadUID, serialNumber } = this.state;
      const addAsEnvironment = addAs === 'environment';
      const addAsVolume = addAs === 'volume';
      const addAsDisk = addAs === 'disk';
      const selectWorkloadPlaceholder = 'Select a workload';

      return (
        <form
          onSubmit={this.submit}
          name="co-add-secret-to-workload"
          className="co-add-secret-to-workload modal-content"
        >
          <ModalTitle>Add Secret to Workload</ModalTitle>
          <ModalBody>
            <p>
              Add all values from <ResourceIcon kind="Secret" />
              {secretName} to a workload as environment variables or a volume.
            </p>
            <div className="form-group">
              <label
                className="control-label co-required"
                htmlFor="co-add-secret-to-workload__workload"
              >
                Add this secret to workload
              </label>
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
              {!addAsDisk && (
                <div>
                  <RadioInput
                    title="Environment Variables"
                    name="co-add-secret-to-workload__add-as"
                    id="co-add-secret-to-workload__envvars"
                    value="environment"
                    onChange={this.onAddAsChange}
                    checked={addAsEnvironment}
                  />
                  {addAsEnvironment && (
                    <div className="co-m-radio-desc">
                      <div className="form-group">
                        <label htmlFor="co-add-secret-to-workload__prefix">Prefix</label>
                        <input
                          className="pf-c-form-control"
                          name="prefix"
                          id="co-add-secret-to-workload__prefix"
                          placeholder="(optional)"
                          type="text"
                          onChange={this.handleChange}
                        />
                      </div>
                    </div>
                  )}
                  <RadioInput
                    title="Volume"
                    name="co-add-secret-to-workload__add-as"
                    id="co-add-secret-to-workload__volume"
                    value="volume"
                    onChange={this.onAddAsChange}
                    checked={addAsVolume}
                  />
                  {addAsVolume && (
                    <div className="co-m-radio-desc">
                      <div className="form-group">
                        <label
                          htmlFor="co-add-secret-to-workload__mountpath"
                          className="co-required"
                        >
                          Mount Path
                        </label>
                        <input
                          className="pf-c-form-control"
                          name="mountPath"
                          id="co-add-secret-to-workload__mountpath"
                          type="text"
                          onChange={this.handleChange}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              {addAsDisk && (
                <div>
                  <RadioInput
                    title="Disk"
                    name="co-add-secret-to-workload__add-as"
                    id="co-add-secret-to-workload__disk"
                    value="disk"
                    onChange={this.onAddAsChange}
                    checked={addAsDisk}
                  />
                  <div className="co-m-radio-desc">
                    <div className="form-group">
                      <label
                        htmlFor="co-add-secret-to-workload__serialNumber"
                        className="co-required"
                      >
                        Serial Number
                      </label>
                      <input
                        className="pf-c-form-control"
                        name="serialNumber"
                        id="co-add-secret-to-workload__serialNumber"
                        type="text"
                        value={serialNumber}
                        onChange={this.handleChange}
                        disabled={!!this.state.errorMessage}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </fieldset>
          </ModalBody>
          <ModalSubmitFooter
            errorMessage={this.state.errorMessage}
            inProgress={this.state.inProgress}
            submitText="Save"
            cancel={this.props.cancel}
            submitDisabled={addAsDisk && !!this.state.errorMessage}
          />
        </form>
      );
    }
  },
);

export const configureAddSecretToWorkloadModal = createModalLauncher<AddSecretToWorkloadModalProps>(
  AddSecretToWorkloadModal,
);

type WorkloadItem = {
  model: K8sKind;
  obj: K8sResourceKind;
};

export type AddSecretToWorkloadModalProps = {
  cancel: () => void;
  close: () => void;
  secretName: string;
  namespace: string;
  blocking?: boolean;
};

type SecretExtensionProps = {
  secretExtensions: AddSecretToVMExtension[];
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
  serialNumber: string;
  vmTemplate: TemplateKind;
};
