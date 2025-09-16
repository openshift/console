import { useState, useCallback } from 'react';
import * as _ from 'lodash-es';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { MachineAutoscalerModel } from '../../models';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { NumberSpinner, resourcePathFromModel } from '../utils';
import { k8sCreate, K8sResourceKind } from '../../module/k8s';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

const ConfigureMachineAutoscalerModal = (props: ConfigureMachineAutoscalerModalProps) => {
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
  }, [props.machineSet, minReplicas, maxReplicas]);

  const submit = useCallback(
    (event): void => {
      event.preventDefault();
      const { close } = props;
      const promise = createAutoscaler();
      handlePromise(promise)
        .then((obj: K8sResourceKind) => {
          close();
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
    [props, createAutoscaler, handlePromise, navigate],
  );

  const {
    machineSet: {
      metadata: { name },
    },
    cancel,
  } = props;
  const { t } = useTranslation();

  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle className="modal-header">{t('public~Create MachineAutoscaler')}</ModalTitle>
      <ModalBody>
        <p>
          <Trans t={t} ns="public">
            This will automatically scale machine set <b>{{ name }}</b>.
          </Trans>
        </p>
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
      </ModalBody>
      <ModalSubmitFooter
        inProgress={inProgress}
        errorMessage={errorMessage}
        cancel={cancel}
        submitText={t('public~Create')}
        cancelText={t('public~Cancel')}
      />
    </form>
  );
};

export const configureMachineAutoscalerModal = createModalLauncher(ConfigureMachineAutoscalerModal);

type ConfigureMachineAutoscalerModalProps = {
  machineSet: K8sResourceKind;
  cancel: () => void;
  close: () => void;
};
