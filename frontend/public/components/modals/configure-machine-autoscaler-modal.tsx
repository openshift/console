import { useState, useCallback } from 'react';
import * as _ from 'lodash-es';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';

import { MachineAutoscalerModel } from '../../models';
import { createModalLauncher } from '../factory/modal';
import { NumberSpinner, resourcePathFromModel } from '../utils';
import { k8sCreate, K8sResourceKind } from '../../module/k8s';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

export const ConfigureMachineAutoscalerModal: OverlayComponent<ConfigureMachineAutoscalerModalProps> = (
  props,
) => {
  const { machineSet, closeOverlay, close, cancel: cancelProp } = props;
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
    } = props.machineSet;

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
    return k8sCreate(MachineAutoscalerModel, machineAutoscaler);
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
    machineSet: {
      metadata: { name },
    },
  } = props;
  const { t } = useTranslation();

  return (
    <Modal isOpen onClose={closeOverlay} variant="small">
      <ModalHeader
        title={t('public~Create MachineAutoscaler')}
        labelId="configure-machine-autoscaler-modal-title"
      />
      <ModalBody>
        <div className="form-group">
          <p>
            <Trans t={t} ns="public">
              This will automatically scale machine set <b>{{ name }}</b>.
            </Trans>
          </p>
        </div>
        <div className="form-group">
          <label>
            {t('public~Minimum replicas:')}
            <NumberSpinner
              value={minReplicas}
              onChange={changeMinReplicas}
              changeValueBy={changeMinReplicasBy}
              autoFocus
              required
            />
          </label>
        </div>
        <div className="form-group">
          <label>
            {t('public~Maximum replicas:')}
            <NumberSpinner
              value={maxReplicas}
              onChange={changeMaxReplicas}
              changeValueBy={changeMaxReplicasBy}
              required
            />
          </label>
        </div>
        {errorMessage && (
          <HelperText isLiveRegion className="pf-v6-u-mt-md">
            <HelperTextItem variant="error">{errorMessage}</HelperTextItem>
          </HelperText>
        )}
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

export const configureMachineAutoscalerModal = createModalLauncher(ConfigureMachineAutoscalerModal);

type ConfigureMachineAutoscalerModalProps = {
  machineSet: K8sResourceKind;
  cancel?: () => void;
  close?: () => void;
};
