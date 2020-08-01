import * as React from 'react';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { Button } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons';
import { withHandlePromise } from '@console/internal/components/utils';
import { k8sUpdate, referenceFor, K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { RootState } from '@console/internal/redux';

export const ResourceRequirements: React.FC<ResourceRequirementsProps> = (props) => {
  const { cpu, memory, storage, onChangeCPU, onChangeMemory, onChangeStorage, path = '' } = props;

  return (
    <div className="row co-m-form-row">
      <div className="col-xs-4">
        <label
          style={{ fontWeight: 300 }}
          className="text-muted text-uppercase"
          htmlFor={`${path}.cpu`}
        >
          CPU cores
        </label>
        <input
          value={cpu}
          onChange={(e) => onChangeCPU(e.target.value)}
          id={`${path}.cpu`}
          name="cpu"
          type="text"
          className="pf-c-form-control"
          placeholder="500m"
        />
      </div>
      <div className="col-xs-4">
        <label
          style={{ fontWeight: 300 }}
          className="text-muted text-uppercase"
          htmlFor={`${path}.memory`}
        >
          Memory
        </label>
        <input
          value={memory}
          onChange={(e) => onChangeMemory(e.target.value)}
          id={`${path}.memory`}
          name="memory"
          type="text"
          className="pf-c-form-control"
          placeholder="50Mi"
        />
      </div>
      <div className="col-xs-4">
        <label
          style={{ fontWeight: 300 }}
          className="text-muted text-uppercase"
          htmlFor={`${path}.ephemeral-storage`}
        >
          Storage
        </label>
        <input
          value={storage}
          onChange={(e) => onChangeStorage(e.target.value)}
          id={`${path}.ephemeral-storage`}
          name="ephemeral-storage"
          type="text"
          className="pf-c-form-control"
          placeholder="50Mi"
        />
      </div>
    </div>
  );
};

export const ResourceRequirementsModal = withHandlePromise(
  (props: ResourceRequirementsModalProps) => {
    const { obj, path, type, model } = props;
    const [cpu, setCPU] = React.useState<string>(_.get(obj.spec, `${path}.${type}.cpu`, ''));
    const [memory, setMemory] = React.useState<string>(
      _.get(obj.spec, `${path}.${type}.memory`, ''),
    );
    const [storage, setStorage] = React.useState<string>(
      _.get(obj.spec, `${path}.${type}.ephemeral-storage`),
    );

    const submit = (e) => {
      e.preventDefault();

      let newObj = _.cloneDeep(obj);
      if (cpu !== '' || memory !== '' || storage !== '') {
        newObj = _.set(newObj, `spec.${path}.${type}`, {
          cpu,
          memory,
          'ephemeral-storage': storage,
        });
      }

      return props.handlePromise(k8sUpdate(model, newObj), props.close);
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
          submitText="Save"
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
    const { cpu, memory, 'ephemeral-storage': storage } = _.get(
      obj.spec,
      `${path}.${type}`,
      'none',
    );

    const onClick = () => {
      const modal = createModalLauncher(ResourceRequirementsModal);
      const description = `Define the resource ${type} for this ${obj.kind} instance.`;
      const title = `${obj.kind} Resource ${_.capitalize(type)}`;

      return modal({ title, description, obj, model, type, path });
    };

    return (
      <Button
        type="button"
        isInline
        data-test-id="configure-modal-btn"
        onClick={onClick}
        variant="link"
      >
        {`CPU: ${cpu || 'none'}, Memory: ${memory || 'none'}, Storage: ${storage || 'none'}`}
        <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />
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
