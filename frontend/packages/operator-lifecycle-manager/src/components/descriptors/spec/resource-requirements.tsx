import type { FC } from 'react';
import { useState } from 'react';
import { Button, Grid, GridItem } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalWrapper,
} from '@console/internal/components/factory/modal';
import { k8sUpdate, referenceFor, K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';

export const ResourceRequirements: FC<ResourceRequirementsProps> = (props) => {
  const { t } = useTranslation();
  const { cpu, memory, storage, onChangeCPU, onChangeMemory, onChangeStorage, path = '' } = props;

  return (
    <>
      <GridItem span={4}>
        <label
          style={{ fontWeight: 300 }}
          className="pf-v6-u-text-color-subtle"
          htmlFor={`${path}.cpu`}
        >
          {t('olm~CPU cores')}
        </label>
        <span className="pf-v6-c-form-control">
          <input
            value={cpu}
            onChange={(e) => onChangeCPU(e.target.value)}
            id={`${path}.cpu`}
            name="cpu"
            type="text"
            placeholder="500m"
          />
        </span>
      </GridItem>
      <GridItem span={4}>
        <label
          style={{ fontWeight: 300 }}
          className="pf-v6-u-text-color-subtle"
          htmlFor={`${path}.memory`}
        >
          {t('olm~Memory')}
        </label>
        <span className="pf-v6-c-form-control">
          <input
            value={memory}
            onChange={(e) => onChangeMemory(e.target.value)}
            id={`${path}.memory`}
            name="memory"
            type="text"
            placeholder="50Mi"
          />
        </span>
      </GridItem>
      <GridItem span={4}>
        <label
          style={{ fontWeight: 300 }}
          className="pf-v6-u-text-color-subtle"
          htmlFor={`${path}.ephemeral-storage`}
        >
          {t('olm~Storage')}
        </label>
        <span className="pf-v6-c-form-control">
          <input
            value={storage}
            onChange={(e) => onChangeStorage(e.target.value)}
            id={`${path}.ephemeral-storage`}
            name="ephemeral-storage"
            type="text"
            placeholder="50Mi"
          />
        </span>
      </GridItem>
    </>
  );
};

export const ResourceRequirementsModal = (props: ResourceRequirementsModalProps) => {
  const { t } = useTranslation();
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const { obj, path, type, model, close, cancel } = props;
  const [cpu, setCPU] = useState<string>(_.get(obj.spec, `${path}.${type}.cpu`, ''));
  const [memory, setMemory] = useState<string>(_.get(obj.spec, `${path}.${type}.memory`, ''));
  const [storage, setStorage] = useState<string>(
    _.get(obj.spec, `${path}.${type}.ephemeral-storage`, ''),
  );

  const submit = (e) => {
    e.preventDefault();
    const newObj = _.set(_.cloneDeep(obj), `spec.${path}.${type}`, {
      ...(cpu && { cpu }),
      ...(memory && { memory }),
      ...(storage && { 'ephemeral-storage': storage }),
    });
    handlePromise(k8sUpdate(model, newObj))
      .then(() => {
        close();
      })
      .catch(() => {});
  };

  return (
    <form onSubmit={(e) => submit(e)} className="modal-content">
      <ModalTitle>{props.title}</ModalTitle>
      <ModalBody>
        <Grid hasGutter>
          <GridItem>{props.description}</GridItem>
          <ResourceRequirements
            cpu={cpu}
            memory={memory}
            storage={storage}
            onChangeCPU={setCPU}
            onChangeMemory={setMemory}
            onChangeStorage={setStorage}
            path={path}
          />
        </Grid>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={t('public~Save')}
        cancel={cancel}
      />
    </form>
  );
};

const ResourceRequirementsModalProvider: OverlayComponent<ResourceRequirementsModalProviderProps> = (
  props,
) => {
  return (
    <ModalWrapper blocking onClose={props.closeOverlay}>
      <ResourceRequirementsModal
        title={props.title}
        description={props.description}
        obj={props.obj}
        model={props.model}
        type={props.type}
        path={props.path}
        close={props.closeOverlay}
        cancel={props.closeOverlay}
      />
    </ModalWrapper>
  );
};

export const ResourceRequirementsModalLink: FC<ResourceRequirementsModalLinkProps> = (props) => {
  const { obj, type, path } = props;
  const { t } = useTranslation();
  const launchOverlay = useOverlay();
  const [model] = useK8sModel(referenceFor(obj));
  const none = t('public~None');
  const { cpu, memory, 'ephemeral-storage': storage } = _.get(obj.spec, `${path}.${type}`, {});

  const onClick = () => {
    const description = t('olm~Define the resource {{type}} for this {{kind}} instance.', {
      type,
      kind: obj.kind,
    });
    const title = t('olm~{{kind}} Resource {{type}}', {
      kind: obj.kind,
      type: _.capitalize(type),
    });

    launchOverlay(ResourceRequirementsModalProvider, {
      title,
      description,
      obj,
      model,
      type,
      path,
    });
  };

  return (
    <Button
      icon={<PencilAltIcon />}
      iconPosition="end"
      type="button"
      isInline
      data-test-id="configure-modal-btn"
      onClick={onClick}
      variant="link"
    >
      {t('olm~CPU: {{cpu}}, Memory: {{memory}}, Storage: {{storage}}', {
        cpu: cpu || none,
        memory: memory || none,
        storage: storage || none,
      })}
    </Button>
  );
};

type ResourceRequirementsModalProviderProps = {
  title: string;
  description: string;
  obj: K8sResourceKind;
  model: K8sKind;
  type: 'requests' | 'limits';
  path: string;
};

export type ResourceRequirementsModalProps = {
  title: string;
  description: string;
  obj: K8sResourceKind;
  model: K8sKind;
  type: 'requests' | 'limits';
  path: string;
  cancel?: () => void;
  close?: () => void;
};

export type ResourceRequirementsProps = {
  cpu: string;
  memory: string;
  storage: string;
  onChangeCPU: (value: string) => void;
  onChangeMemory: (value: string) => void;
  onChangeStorage: (value: string) => void;
  path?: string;
};

export type ResourceRequirementsModalLinkProps = {
  obj: K8sResourceKind;
  type: 'requests' | 'limits';
  path: string;
};

ResourceRequirements.displayName = 'ResourceRequirements';
ResourceRequirementsModalLink.displayName = 'ResourceRequirementsModalLink';
ResourceRequirementsModal.displayName = 'ResourceRequirementsModal';
