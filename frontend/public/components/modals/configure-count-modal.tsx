import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { k8sPatch, K8sResourceKind, K8sKind } from '../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { NumberSpinner, withHandlePromise, HandlePromiseProps } from '../utils';

export const ConfigureCountModal = withHandlePromise((props: ConfigureCountModalProps) => {
  const {
    defaultValue,
    path,
    resource,
    resourceKind,
    handlePromise,
    title,
    titleKey,
    message,
    messageKey,
    messageVariables,
    close,
  } = props;
  const getPath = path.substring(1).replace('/', '.');
  const [value, setValue] = React.useState<number>(_.get(resource, getPath) || defaultValue);
  const { t } = useTranslation();

  const submit = (e) => {
    e.preventDefault();

    const patch = [{ op: 'replace', path, value: _.toInteger(value) }];

    const invalidateState = props.invalidateState || _.noop;

    invalidateState(true, _.toInteger(value));
    handlePromise(
      k8sPatch(resourceKind, resource, patch),
      () => close(),
      (error) => {
        invalidateState(false);
        throw error;
      },
    );
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content ">
      <ModalTitle>{titleKey ? t(titleKey) : title}</ModalTitle>
      <ModalBody>
        <p>{messageKey ? t(messageKey, messageVariables) : message}</p>
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
        submitText={props.buttonTextKey ? t(props.buttonTextKey) : props.buttonText}
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
        // t('modal~Edit Pod count')
        titleKey: 'modal~Edit Pod count',
        // t('modal~{{resourceKinds}} maintain the desired number of healthy pods.', {resourceKind: props.resourceKind.labelPlural})
        messageKey: 'modal~{{resourceKinds}} maintain the desired number of healthy pods.',
        messageVariables: { resourceKinds: props.resourceKind.labelPlural },
        path: '/spec/replicas',
        // t('modal~Save')
        buttonTextKey: 'modal~Save',
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
        // t('modal~Edit parallelism')
        titleKey: 'modal~Edit parallelism',
        // t('modal~{{resourceKinds}} create one or more pods and ensure that a specified number of them successfully terminate. When the specified number of completions is successfully reached, the job is complete.', {resourceKind: props.resourceKind.labelPlural})
        messageKey:
          'modal~{{resourceKinds}} create one or more pods and ensure that a specified number of them successfully terminate. When the specified number of completions is successfully reached, the job is complete.',
        messageVariables: { resourceKinds: props.resourceKind.labelPlural },
        path: '/spec/parallelism',
        // t('modal~Save')
        buttonTextKey: 'modal~Save',
      },
      props,
    ),
  );
};

export type ConfigureCountModalProps = {
  message?: string;
  messageKey: string;
  messageVariables: { [key: string]: any };
  buttonText?: string;
  buttonTextKey?: string;
  defaultValue: number;
  path: string;
  resource: K8sResourceKind;
  resourceKind: K8sKind;
  title?: string;
  titleKey?: string;
  invalidateState?: (isInvalid: boolean, count?: number) => void;
  inProgress: boolean;
  errorMessage: string;
  cancel?: () => void;
  close?: () => void;
} & HandlePromiseProps;
