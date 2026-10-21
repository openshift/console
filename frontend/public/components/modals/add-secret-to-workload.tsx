import type { FC, ReactEventHandler, FormEvent, ReactNode } from 'react';
import { useState, useEffect, useCallback } from 'react';
import * as _ from 'lodash';
import * as fuzzy from 'fuzzysearch';
import { useNavigate } from 'react-router';
import {
  Button,
  Content,
  ContentVariants,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
  Radio,
  TextInput,
} from '@patternfly/react-core';

import { K8sKind, k8sList, k8sPatch, K8sResourceKind } from '../../module/k8s';
import { DeploymentModel, DeploymentConfigModel, StatefulSetModel } from '../../models';
import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { ResourceIcon, ResourceName } from '../utils/resource-icon';
import { resourcePathFromModel } from '../utils/resource-link';
/* eslint-disable import/named */
import { Trans, useTranslation } from 'react-i18next';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { ModalCallback } from './types';
import type { ModalComponentProps } from '@console/shared/src/types/modal';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';

const workloadResourceModels = [DeploymentModel, DeploymentConfigModel, StatefulSetModel];
const getContainers = (workload: K8sResourceKind) =>
  _.get(workload, 'spec.template.spec.containers') || [];

export const AddSecretToWorkloadModal: FC<AddSecretToWorkloadModalProps> = (props) => {
  const { namespace, secretName } = props;
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [inProgress, setInProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [workloadOptions, setWorkloadOptions] = useState({});
  const [workloadsByUID, setWorkloadsByUID] = useState({});
  const [selectedWorkloadUID, setSelectedWorkloadUID] = useState('');
  const [addAs, setAddAs] = useState('environment');
  const [prefix, setPrefix] = useState('');
  const [mountPath, setMountPath] = useState('');

  useEffect(() => {
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

  const onAddAsChange: ReactEventHandler<HTMLInputElement> = (event) => {
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

  const submit = (event: FormEvent<EventTarget>) => {
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
        navigate(resourcePathFromModel(model, name, ns));
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
    <>
      <ModalHeader
        title={t('public~Add secret to workload')}
        data-test-id="modal-title"
        labelId="add-secret-to-workload-modal-title"
      />
      <ModalBody>
        <Content component={ContentVariants.p}>
          <Trans t={t} ns="public">
            Add all values from <ResourceIcon kind="Secret" />
            {{ secretName }} to a workload as environment variables or a volume.
          </Trans>
        </Content>
        <Form id="co-add-secret-to-workload" onSubmit={submit}>
          <FormGroup
            label={t('public~Add this secret to workload')}
            isRequired
            fieldId="co-add-secret-to-workload__workload"
          >
            <ConsoleSelect
              items={workloadOptions}
              selectedKey={selectedWorkloadUID}
              title={selectWorkloadPlaceholder}
              onChange={onWorkloadChange}
              autocompleteFilter={autocompleteFilter}
              autocompletePlaceholder={selectWorkloadPlaceholder}
              id="co-add-secret-to-workload__workload"
              data-test="add-secret-to-workload-button"
            />
          </FormGroup>
          <FormGroup
            label={t('public~Add secret as')}
            isRequired
            role="radiogroup"
            fieldId="co-add-secret-to-workload"
            isStack
          >
            <Radio
              id="co-add-secret-to-workload__envvars"
              name="co-add-secret-to-workload__add-as"
              label={t('public~Environment variables')}
              value="environment"
              onChange={onAddAsChange}
              isChecked={addAsEnvironment}
              data-test="Environment variables-radio-input"
              data-checked-state={addAsEnvironment}
              body={
                addAsEnvironment && (
                  <FormGroup label={t('public~Prefix')} fieldId="co-add-secret-to-workload__prefix">
                    <TextInput
                      name="prefix"
                      id="co-add-secret-to-workload__prefix"
                      data-test="add-secret-to-workload-prefix"
                      placeholder="(optional)"
                      type="text"
                      value={prefix}
                      onChange={(_event, value) => setPrefix(value)}
                    />
                  </FormGroup>
                )
              }
            />
            <Radio
              id="co-add-secret-to-workload__volume"
              name="co-add-secret-to-workload__add-as"
              label={t('public~Volume')}
              value="volume"
              onChange={onAddAsChange}
              isChecked={addAsVolume}
              data-test="Volume-radio-input"
              data-checked-state={addAsVolume}
              body={
                addAsVolume && (
                  <FormGroup
                    label={t('public~Mount path')}
                    isRequired
                    fieldId="co-add-secret-to-workload__mountpath"
                  >
                    <TextInput
                      name="mountPath"
                      id="co-add-secret-to-workload__mountpath"
                      data-test="add-secret-to-workload-mountpath"
                      type="text"
                      value={mountPath}
                      onChange={(_event, value) => setMountPath(value)}
                      isRequired
                    />
                  </FormGroup>
                )
              }
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          onClick={submit}
          isLoading={inProgress}
          isDisabled={inProgress}
          data-test="confirm-action"
          id="confirm-action"
          form="co-add-secret-to-workload"
        >
          {t('public~Save')}
        </Button>
        <Button variant="link" onClick={props.cancel} data-test-id="modal-cancel-action">
          {t('public~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export const AddSecretToWorkloadModalOverlay: OverlayComponent<AddSecretToWorkloadModalProps> = (
  props,
) => {
  const [isOpen, setIsOpen] = useState(true);
  const handleClose = () => {
    setIsOpen(false);
    props.closeOverlay();
  };

  return isOpen ? (
    <Modal
      variant={ModalVariant.small}
      isOpen
      onClose={handleClose}
      aria-labelledby="add-secret-to-workload-modal-title"
    >
      <AddSecretToWorkloadModal close={handleClose} cancel={handleClose} {...props} />
    </Modal>
  ) : null;
};

export const useAddSecretToWorkloadModalLauncher = (
  props: AddSecretToWorkloadModalProps,
): ModalCallback => {
  const launchModal = useOverlay();

  return useCallback(() => {
    // Move focus away from the triggering element to prevent aria-hidden warning
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    return launchModal<AddSecretToWorkloadModalProps>(AddSecretToWorkloadModalOverlay, props);
  }, [launchModal, props]);
};

type WorkloadItem = {
  model: K8sKind;
  obj: K8sResourceKind;
};

export type AddSecretToWorkloadModalProps = {
  secretName: string;
  namespace: string;
} & ModalComponentProps;

export type AddSecretToWorkloadModalState = {
  inProgress: boolean;
  errorMessage: string;
  workloadOptions: {
    [uid: string]: ReactNode;
  };
  workloadsByUID: {
    [uid: string]: WorkloadItem;
  };
  selectedWorkloadUID: string;
  addAs: string;
  prefix: string;
  mountPath: string;
};
