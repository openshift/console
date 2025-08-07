import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { k8sPatch, K8sResourceKind, K8sKind } from '../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { NumberSpinner, withHandlePromise, HandlePromiseProps } from '../utils';

export const ConfigureCountModal = withHandlePromise((props: ConfigureCountModalProps) => {
  const {
    buttonText,
    buttonTextKey,
    buttonTextVariables,
    defaultValue,
    labelKey,
    path,
    resource,
    resourceKind,
    opts,
    handlePromise,
    title,
    titleKey,
    titleVariables,
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
      k8sPatch(resourceKind, resource, patch, opts),
      () => close(),
      (error) => {
        invalidateState(false);
        throw error;
      },
    );
  };

  const messageVariablesSafe = { ...messageVariables };
  if (labelKey) {
    messageVariablesSafe.resourceKinds = t(labelKey, titleVariables);
  }

  const onValueChange = (event: React.FormEvent<HTMLInputElement>) => {
    const eventValue = (event.target as HTMLInputElement).value;
    const numericValue = Number(eventValue);
    if (!isNaN(numericValue)) {
      setValue(numericValue);
    }
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content ">
      <ModalTitle>{titleKey ? t(titleKey, titleVariables) : title}</ModalTitle>
      <ModalBody>
        <p className="modal-paragraph">
          {messageKey ? t(messageKey, messageVariablesSafe) : message}
        </p>
        <NumberSpinner
          value={value}
          onChange={onValueChange}
          changeValueBy={(operation) => setValue(_.toInteger(value) + operation)}
          autoFocus
          required
          min={0}
        />
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={props.errorMessage}
        inProgress={props.inProgress}
        submitText={buttonTextKey ? t(buttonTextKey, buttonTextVariables) : buttonText}
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
        // t('public~Edit Pod count')
        titleKey: 'public~Edit Pod count',
        labelKey: props.resourceKind.labelPluralKey,
        // t('public~{{resourceKinds}} maintain the desired number of healthy pods.', {resourceKind: props.resourceKind.labelPlural})
        messageKey: 'public~{{resourceKinds}} maintain the desired number of healthy pods.',
        messageVariables: { resourceKinds: props.resourceKind.labelPlural },
        path: '/spec/replicas',
        // t('public~Save')
        buttonTextKey: 'public~Save',
        opts: { path: 'scale' },
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
        // t('public~Edit parallelism')
        titleKey: 'public~Edit parallelism',
        // t('public~{{resourceKinds}} create one or more pods and ensure that a specified number of them successfully terminate. When the specified number of completions is successfully reached, the job is complete.', {resourceKind: props.resourceKind.labelPlural})
        messageKey:
          'public~{{resourceKinds}} create one or more pods and ensure that a specified number of them successfully terminate. When the specified number of completions is successfully reached, the job is complete.',
        messageVariables: { resourceKinds: props.resourceKind.labelPlural },
        path: '/spec/parallelism',
        // t('public~Save')
        buttonTextKey: 'public~Save',
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
  buttonTextVariables?: { [key: string]: any };
  defaultValue: number;
  labelKey?: string;
  path: string;
  resource: K8sResourceKind;
  resourceKind: K8sKind;
  opts?: { [key: string]: any };
  title?: string;
  titleKey?: string;
  titleVariables?: { [key: string]: any };
  invalidateState?: (isInvalid: boolean, count?: number) => void;
  inProgress: boolean;
  errorMessage: string;
  cancel?: () => void;
  close?: () => void;
} & HandlePromiseProps;
