import * as React from 'react';
import * as _ from 'lodash-es';
import * as fuzzy from 'fuzzysearch';

import { K8sKind, k8sList, k8sPatch, K8sResourceKind } from '../../module/k8s';
import { DeploymentModel, DeploymentConfigModel, StatefulSetModel } from '../../models';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { Dropdown, history, ResourceIcon, ResourceName, resourcePathFromModel } from '../utils';
import { RadioInput } from '../radio';
/* eslint-disable import/named */
import { Trans, withTranslation, WithTranslation } from 'react-i18next';

const workloadResourceModels = [DeploymentModel, DeploymentConfigModel, StatefulSetModel];
const getContainers = (workload: K8sResourceKind) =>
  _.get(workload, 'spec.template.spec.containers') || [];

export class AddSecretToWorkloadModalWithTrans extends React.Component<
  AddSecretToWorkloadModalProps & WithTranslation,
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
  };

  componentDidMount() {
    const { namespace } = this.props;
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
      const sortedItems = _.orderBy(allItems, ['obj.metadata.name', 'model.kind'], ['asc', 'asc']);
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

  onWorkloadChange = (selectedWorkloadUID: string) => {
    this.setState({ selectedWorkloadUID });
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
    const { t } = this.props;
    const { secretName } = this.props;
    const { addAs, workloadOptions, selectedWorkloadUID } = this.state;
    const addAsEnvironment = addAs === 'environment';
    const addAsVolume = addAs === 'volume';
    const selectWorkloadPlaceholder = t('public~Select a workload');

    return (
      <form
        onSubmit={this.submit}
        name="co-add-secret-to-workload"
        className="co-add-secret-to-workload modal-content"
      >
        <ModalTitle>{t('public~Add secret to workload')}</ModalTitle>
        <ModalBody>
          <p>
            <Trans i18nKey="public~addSecretDescription">
              Add all values from <ResourceIcon kind="Secret" />
              {{ secretName }} to a workload as environment variables or a volume.
            </Trans>
          </p>
          <div className="form-group">
            <label
              className="control-label co-required"
              htmlFor="co-add-secret-to-workload__workload"
            >
              {t('public~Add this secret to workload')}
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
            <legend className="co-legend co-required">{t('public~Add secret as')}</legend>
            <RadioInput
              title={t('public~Environment variables')}
              name="co-add-secret-to-workload__add-as"
              id="co-add-secret-to-workload__envvars"
              value="environment"
              onChange={this.onAddAsChange}
              checked={addAsEnvironment}
            />
            {addAsEnvironment && (
              <div className="co-m-radio-desc">
                <div className="form-group">
                  <label htmlFor="co-add-secret-to-workload__prefix">{t('public~Prefix')}</label>
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
              title={t('public~Volume')}
              name="co-add-secret-to-workload__add-as"
              id="co-add-secret-to-workload__volume"
              value="volume"
              onChange={this.onAddAsChange}
              checked={addAsVolume}
            />
            {addAsVolume && (
              <div className="co-m-radio-desc">
                <div className="form-group">
                  <label htmlFor="co-add-secret-to-workload__mountpath" className="co-required">
                    {t('public~Mount path')}
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
          </fieldset>
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={this.state.errorMessage}
          inProgress={this.state.inProgress}
          submitText={t('public~Save')}
          cancel={this.props.cancel}
        />
      </form>
    );
  }
}

const AddSecretToWorkloadModal = withTranslation()(AddSecretToWorkloadModalWithTrans);

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
