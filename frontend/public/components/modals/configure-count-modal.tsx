import * as _ from 'lodash-es';
import * as React from 'react';

import { k8sPatch, K8sResourceKind, K8sKind } from '../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { NumberSpinner, withHandlePromise } from '../utils';

export const ConfigureCountModal = withHandlePromise((props: ConfigureCountModalProps) => {
  const getPath = props.path.substring(1).replace('/', '.');
  const [value, setValue] = React.useState<number>(
    _.get(props.resource, getPath) || props.defaultValue,
  );

  const submit = (e) => {
    e.preventDefault();

    const patch = [{ op: 'replace', path: props.path, value: _.toInteger(value) }];

    const invalidateState = props.invalidateState || _.noop;

    invalidateState(true, _.toInteger(value));
    props
      .handlePromise(k8sPatch(props.resourceKind, props.resource, patch))
      .then(props.close)
      .catch((error) => {
        invalidateState(false);
        throw error;
      });
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content ">
      <ModalTitle>{props.title}</ModalTitle>
      <ModalBody>
        <p>{props.message}</p>
        <NumberSpinner
          className="pf-c-form-control"
          value={value}
          onChange={(e: any) => setValue(e.target.value)}
          changeValueBy={(operation) => setValue(_.toInteger(value) + operation)}
          autoFocus
          required
          min={0}
        />
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={props.errorMessage}
        inProgress={props.inProgress}
        submitText={props.buttonText}
        cancel={props.cancel}
      />
    </form>
  );
});

export const configureCountModal = createModalLauncher(ConfigureCountModal);

export const configureReplicaCountModal = (props) => {
  return configureCountModal(
    _.assign(
      {},
      {
        defaultValue: 0,
        title: 'Edit Pod Count',
        message: `${props.resourceKind.labelPlural} maintain the desired number of healthy pods.`,
        path: '/spec/replicas',
        buttonText: 'Save',
      },
      props,
    ),
  );
};

export const configureJobParallelismModal = (props) => {
  return configureCountModal(
    _.defaults(
      {},
      {
        defaultValue: 1,
        title: 'Edit Parallelism',
        message: `${props.resourceKind.labelPlural} create one or more pods and ensure that a specified number of them successfully terminate. When the specified number of completions is successfully reached, the job is complete.`,
        path: '/spec/parallelism',
        buttonText: 'Save',
      },
      props,
    ),
  );
};

export type ConfigureCountModalProps = {
  message: string;
  buttonText: string;
  defaultValue: number;
  path: string;
  resource: K8sResourceKind;
  resourceKind: K8sKind;
  title: string;
  invalidateState?: (isInvalid: boolean, count?: number) => void;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  inProgress: boolean;
  errorMessage: string;
  cancel?: () => void;
  close?: () => void;
};
