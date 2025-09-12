import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  HelperText,
  HelperTextItem,
  FormGroup,
  Form,
} from '@patternfly/react-core';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { K8sResourceKind, K8sModel } from '../../module/k8s';
import { NumberSpinner } from '../utils';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

export const ConfigureCountModal: OverlayComponent<ConfigureCountModalProps> = (props) => {
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
    title,
    titleKey,
    titleVariables,
    message,
    messageKey,
    messageVariables,
    closeOverlay,
  } = props;
  const getPath = path ? path.substring(1).replace('/', '.') : '';
  const [value, setValue] = React.useState<number>(_.get(resource, getPath) ?? defaultValue);
  const { t } = useTranslation();
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const submit = React.useCallback(
    (e) => {
      e.preventDefault();

      const patch = [{ op: 'replace', path: path || '', value: _.toInteger(value) }];
      const invalidateState = props.invalidateState || _.noop;

      invalidateState(true, _.toInteger(value));
      resourceKind &&
        resource &&
        handlePromise(
          k8sPatchResource({
            model: resourceKind,
            resource,
            data: patch,
          }),
        )
          .then(() => closeOverlay())
          .catch(() => {
            invalidateState(false);
          });
    },
    [value, path, props.invalidateState, handlePromise, resourceKind, resource, opts, closeOverlay],
  );

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
    <Modal isOpen onClose={closeOverlay} variant="small">
      <ModalHeader
        title={titleKey ? t(titleKey, titleVariables) : title}
        labelId="configure-count-modal-title"
        description={messageKey ? t(messageKey, messageVariablesSafe) : message}
      />
      <ModalBody>
        <Form>
          <FormGroup>
            <NumberSpinner
              value={value}
              onChange={onValueChange}
              changeValueBy={(operation) => setValue(_.toInteger(value) + operation)}
              autoFocus
              required
              min={0}
            />
            {errorMessage && (
              <HelperText isLiveRegion className="pf-v6-u-mt-md">
                <HelperTextItem variant="error">{errorMessage}</HelperTextItem>
              </HelperText>
            )}
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={closeOverlay} type="button">
          {t('public~Cancel')}
        </Button>
        <Button variant="primary" isLoading={inProgress} onClick={submit}>
          {buttonTextKey ? t(buttonTextKey, buttonTextVariables) : buttonText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

/**
 * Hook to launch the configure count modal using useOverlay
 */
export const useConfigureCountModal = (baseProps?: Partial<ConfigureCountModalProps>) => {
  const launcher = useOverlay();
  return useCallback(
    (overrideProps?: Partial<ConfigureCountModalProps>) => {
      const mergedProps = {
        ...baseProps,
        ...overrideProps,
      };
      launcher<ConfigureCountModalProps>(ConfigureCountModal, mergedProps);
    },
    [launcher, baseProps],
  );
};

export const configureReplicaCountModal = (props) => {
  const mergedProps = _.assign(
    {},
    {
      defaultValue: 0,
      titleKey: 'public~Edit Pod count',
      labelKey: props.resourceKind.labelPluralKey,
      messageKey: 'public~{{resourceKinds}} maintain the desired number of healthy pods.',
      messageVariables: { resourceKinds: props.resourceKind.labelPlural },
      path: '/spec/replicas',
      buttonTextKey: 'public~Save',
      opts: { path: 'scale' },
    },
    props,
  );

  // Return the props for the useOverlay pattern
  return mergedProps;
};

export const configureJobParallelismModal = (props) => {
  const mergedProps = _.assign(
    {},
    {
      defaultValue: 1,
      titleKey: 'public~Edit parallelism',
      messageKey:
        'public~{{resourceKinds}} create one or more pods and ensure that a specified number of them successfully terminate. When the specified number of completions is successfully reached, the job is complete.',
      messageVariables: { resourceKinds: props.resourceKind.labelPlural },
      path: '/spec/parallelism',
      buttonTextKey: 'public~Save',
    },
    props,
  );

  // Return the props for the useOverlay pattern
  return mergedProps;
};

export type ConfigureCountModalProps = {
  message?: string;
  messageKey?: string;
  messageVariables?: Record<string, string>;
  buttonText?: string;
  buttonTextKey?: string;
  buttonTextVariables?: Record<string, string>;
  defaultValue?: number;
  labelKey?: string;
  path?: string;
  resource?: K8sResourceKind;
  resourceKind?: K8sModel;
  opts?: { [key: string]: any };
  title?: string;
  titleKey?: string;
  titleVariables?: { [key: string]: any };
  invalidateState?: (isInvalid: boolean, count?: number) => void;
  // Note: cancel and close are not needed with useOverlay pattern as closeOverlay is injected
};
