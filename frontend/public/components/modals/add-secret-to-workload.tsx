import * as React from 'react';
import * as _ from 'lodash-es';
import * as fuzzy from 'fuzzysearch';

import { K8sKind, k8sList, k8sPatch, K8sResourceKind } from '../../module/k8s';
import { DeploymentModel, DeploymentConfigModel, StatefulSetModel } from '../../models';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { Dropdown, history, ResourceIcon, ResourceName, resourcePathFromModel } from '../utils';
import { RadioInput } from '../radio';
/* eslint-disable import/named */
import { Trans, useTranslation } from 'react-i18next';

const workloadResourceModels = [DeploymentModel, DeploymentConfigModel, StatefulSetModel];
const getContainers = (workload: K8sResourceKind) =>
  _.get(workload, 'spec.template.spec.containers') || [];

export const AddSecretToWorkloadModal: React.FC<AddSecretToWorkloadModalProps> = (props) => {
  const { namespace, secretName } = props;
  const { t } = useTranslation();

  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [workloadOptions, setWorkloadOptions] = React.useState({});
  const [workloadsByUID, setWorkloadsByUID] = React.useState({});
  const [selectedWorkloadUID, setSelectedWorkloadUID] = React.useState('');
  const [addAs, setAddAs] = React.useState('environment');
  const [prefix, setPrefix] = React.useState('');
  const [mountPath, setMountPath] = React.useState('');

  React.useEffect(() => {
    const opts = { ns: namespace };

    Promise.all(
      workloadResourceModels.map((model) => {
        return k8sList(model, opts)
          .catch((err) => {
            setErrorMessage(err.message);
            return [];
          })
          .then((res: K8sResourceKind[]): WorkloadItem[] => res.map((obj) => ({ model, obj })));
      }),
    ).then((responses) => {
      // TODO: Group by kind.
      const allItems: WorkloadItem[] = _.flatten(responses);
      const workloadsByUid = _.keyBy(allItems, 'obj.metadata.uid');
      const sortedItems = _.orderBy(allItems, ['obj.metadata.name', 'model.kind'], ['asc', 'asc']);
      const options = _.reduce(
        sortedItems,
        (list, item) => {
          const { name, uid } = item.obj.metadata;
          list[uid] = <ResourceName kind={item.model.kind} name={name} />;
          return list;
        },
        {},
      );
      setWorkloadOptions(options);
      setWorkloadsByUID(workloadsByUid);
    });
  }, [namespace]);

  const autocompleteFilter = (text, item) => {
    return fuzzy(text, item.props.name);
  };

  const onWorkloadChange = (selected: string) => {
    setSelectedWorkloadUID(selected);
  };

  const onAddAsChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
    setAddAs(event.currentTarget.value);
  };

  const getEnvPatches = (obj) => {
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
  };

  const getVolumePatches = (obj) => {
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
  };

  const getPatches = (obj) => {
    return addAs === 'environment' ? getEnvPatches(obj) : getVolumePatches(obj);
  };

  const submit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();

    if (!selectedWorkloadUID) {
      setErrorMessage('You must select a workload.');
      return;
    }

    setInProgress(true);
    setErrorMessage('');

    const workload = workloadsByUID[selectedWorkloadUID];
    const { model, obj } = workload;
    const patches = getPatches(obj);
    k8sPatch(model, obj, patches)
      .then(() => {
        setInProgress(false);
        props.close();
        const { name, namespace: ns } = obj.metadata;
        history.push(resourcePathFromModel(model, name, ns));
      })
      .catch(({ message: err }) => {
        setInProgress(false);
        setErrorMessage(err);
      });
  };

  const addAsEnvironment = addAs === 'environment';
  const addAsVolume = addAs === 'volume';
  const selectWorkloadPlaceholder = t('public~Select a workload');

  return (
    <form
      onSubmit={submit}
      name="co-add-secret-to-workload"
      className="co-add-secret-to-workload modal-content"
    >
      <ModalTitle>{t('public~Add secret to workload')}</ModalTitle>
      <ModalBody>
        <p className="modal-paragraph">
          <Trans t={t} ns="public">
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
            onChange={onWorkloadChange}
            autocompleteFilter={autocompleteFilter}
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
            onChange={onAddAsChange}
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
                  onChange={(e) => setPrefix(e.currentTarget.value)}
                />
              </div>
            </div>
          )}
          <RadioInput
            title={t('public~Volume')}
            name="co-add-secret-to-workload__add-as"
            id="co-add-secret-to-workload__volume"
            value="volume"
            onChange={onAddAsChange}
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
                  onChange={(e) => setMountPath(e.currentTarget.value)}
                  required
                />
              </div>
            </div>
          )}
        </fieldset>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={t('public~Save')}
        cancel={props.cancel}
      />
    </form>
  );
};

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
