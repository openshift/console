import { useState, useCallback } from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
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
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { MachineAutoscalerModel } from '../../models';
import { NumberSpinner } from '../utils/number-spinner';
import { resourcePathFromModel } from '../utils/resource-link';
import { K8sResourceKind } from '../../module/k8s';
import { k8sCreateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

export const ConfigureMachineAutoscalerModal: OverlayComponent<ConfigureMachineAutoscalerModalProps> = ({
  machineSet,
  closeOverlay,
  close,
  cancel: cancelProp,
}) => {
  const navigate = useNavigate();
  const [minReplicas, setMinReplicas] = useState(1);
  const [maxReplicas, setMaxReplicas] = useState(12);
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const changeMinReplicas = (event) => {
    setMinReplicas(_.toInteger(event.target.value));
  };

  const changeMinReplicasBy = (operation) => {
    setMinReplicas(minReplicas + operation);
  };

  const changeMaxReplicas = (event) => {
    setMaxReplicas(_.toInteger(event.target.value));
  };

  const changeMaxReplicasBy = (operation) => {
    setMaxReplicas(maxReplicas + operation);
  };

  const createAutoscaler = useCallback((): Promise<K8sResourceKind> => {
    const {
      apiVersion,
      kind,
      metadata: { name, namespace },
    } = machineSet;

    const machineAutoscaler = {
      apiVersion: 'autoscaling.openshift.io/v1beta1',
      kind: 'MachineAutoscaler',
      metadata: {
        name,
        namespace,
      },
      spec: {
        minReplicas,
        maxReplicas,
        scaleTargetRef: {
          apiVersion,
          kind,
          name,
        },
      },
    };
    return k8sCreateResource({
      model: MachineAutoscalerModel,
      data: machineAutoscaler,
    });
  }, [machineSet, minReplicas, maxReplicas]);

  const submit = useCallback(
    (event): void => {
      event.preventDefault();
      // Use destructured close from props
      const promise = createAutoscaler();
      handlePromise(promise)
        .then((obj: K8sResourceKind) => {
          if (closeOverlay) {
            closeOverlay();
          } else if (close) {
            close();
          }
          navigate(
            resourcePathFromModel(
              MachineAutoscalerModel,
              obj.metadata.name,
              obj.metadata.namespace,
            ),
          );
        })
        .catch(() => {});
    },
    [createAutoscaler, handlePromise, navigate, closeOverlay, close],
  );

  const {
    metadata: { name },
  } = machineSet;
  const { t } = useTranslation();

  return (
    <Modal isOpen onClose={closeOverlay} variant="small">
      <ModalHeader
        title={t('public~Create MachineAutoscaler')}
        labelId="configure-machine-autoscaler-modal-title"
        description={t('public~This will automatically scale machine set {{ name }}.', { name })}
      />
      <ModalBody>
        <Form>
          <FormGroup label={t('public~Minimum replicas:')} fieldId="min-replicas" isRequired>
            <NumberSpinner
              value={minReplicas}
              onChange={changeMinReplicas}
              changeValueBy={changeMinReplicasBy}
              autoFocus
              required
            />
          </FormGroup>
          <FormGroup label={t('public~Maximum replicas:')} fieldId="max-replicas" isRequired>
            <NumberSpinner
              value={maxReplicas}
              onChange={changeMaxReplicas}
              changeValueBy={changeMaxReplicasBy}
              required
            />
          </FormGroup>
          {errorMessage && (
            <HelperText isLiveRegion className="pf-v6-u-mt-md">
              <HelperTextItem variant="error">{errorMessage}</HelperTextItem>
            </HelperText>
          )}
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={closeOverlay || cancelProp} type="button">
          {t('public~Cancel')}
        </Button>
        <Button variant="primary" isLoading={inProgress} onClick={submit}>
          {t('public~Create')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

type ConfigureMachineAutoscalerModalProps = {
  machineSet: K8sResourceKind;
  cancel?: () => void;
  close?: () => void;
};
