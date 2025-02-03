import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { withHandlePromise } from '@console/internal/components/utils';
import { k8sUpdate, referenceFor, K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';

export const ResourceRequirements: React.FC<ResourceRequirementsProps> = (props) => {
  const { t } = useTranslation();
  const { cpu, memory, storage, onChangeCPU, onChangeMemory, onChangeStorage, path = '' } = props;

  return (
    <div className="row co-m-form-row">
      <div className="col-xs-4">
        <label
          style={{ fontWeight: 300 }}
          className="text-muted text-uppercase"
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
      </div>
      <div className="col-xs-4">
        <label
          style={{ fontWeight: 300 }}
          className="text-muted text-uppercase"
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
      </div>
      <div className="col-xs-4">
        <label
          style={{ fontWeight: 300 }}
          className="text-muted text-uppercase"
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
      </div>
    </div>
  );
};

export const ResourceRequirementsModal = withHandlePromise(
  (props: ResourceRequirementsModalProps) => {
    const { t } = useTranslation();
    const { obj, path, type, model, close, handlePromise } = props;
    const [cpu, setCPU] = React.useState<string>(_.get(obj.spec, `${path}.${type}.cpu`, ''));
    const [memory, setMemory] = React.useState<string>(
      _.get(obj.spec, `${path}.${type}.memory`, ''),
    );
    const [storage, setStorage] = React.useState<string>(
      _.get(obj.spec, `${path}.${type}.ephemeral-storage`, ''),
    );

    const submit = (e) => {
      e.preventDefault();
      const newObj = _.set(_.cloneDeep(obj), `spec.${path}.${type}`, {
        ...(cpu && { cpu }),
        ...(memory && { memory }),
        ...(storage && { 'ephemeral-storage': storage }),
      });
      return handlePromise(k8sUpdate(model, newObj), close);
    };

    return (
      <form onSubmit={(e) => submit(e)} className="modal-content">
        <ModalTitle>{props.title}</ModalTitle>
        <ModalBody>
          <div className="row co-m-form-row">
            <div className="col-sm-12">{props.description}</div>
          </div>
          <ResourceRequirements
            cpu={cpu}
            memory={memory}
            storage={storage}
            onChangeCPU={setCPU}
            onChangeMemory={setMemory}
            onChangeStorage={setStorage}
            path={path}
          />
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={props.errorMessage}
          inProgress={props.inProgress}
          submitText={t('public~Save')}
          cancel={props.cancel}
        />
      </form>
    );
  },
);

const stateToProps = ({ k8s }: RootState, { obj }) => ({
  model: k8s.getIn(['RESOURCES', 'models', referenceFor(obj)]) as K8sKind,
});

export const ResourceRequirementsModalLink = connect(stateToProps)(
  (props: ResourceRequirementsModalLinkProps) => {
    const { obj, type, path, model } = props;
    const { t } = useTranslation();
    const none = t('public~None');
    const { cpu, memory, 'ephemeral-storage': storage } = _.get(obj.spec, `${path}.${type}`, {});

    const onClick = () => {
      const modal = createModalLauncher(ResourceRequirementsModal);
      const description = t('olm~Define the resource {{type}} for this {{kind}} instance.', {
        type,
        kind: obj.kind,
      });
      const title = t('olm~{{kind}} Resource {{type}}', {
        kind: obj.kind,
        type: _.capitalize(type),
      });

      return modal({ title, description, obj, model, type, path });
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
  },
);

export type ResourceRequirementsModalProps = {
  title: string;
  description: string;
  obj: K8sResourceKind;
  model: K8sKind;
  type: 'requests' | 'limits';
  path: string;
  handlePromise: <T>(
    promise: Promise<T>,
    onFulfill?: (res) => void,
    onError?: (errorMsg: string) => void,
  ) => void;
  inProgress: boolean;
  errorMessage: string;
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
  model: K8sKind;
  type: 'requests' | 'limits';
  path: string;
};

ResourceRequirements.displayName = 'ResourceRequirements';
ResourceRequirementsModalLink.displayName = 'ResourceRequirementsModalLink';
ResourceRequirementsModal.displayName = 'ResourceRequirementsModal';
