import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation, Trans } from 'react-i18next';

import { MachineAutoscalerModel } from '../../models';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import {
  HandlePromiseProps,
  history,
  NumberSpinner,
  resourcePathFromModel,
  withHandlePromise,
} from '../utils';
import { k8sCreate, K8sResourceKind } from '../../module/k8s';

const ConfigureMachineAutoscalerModal = withHandlePromise(
  (props: ConfigureMachineAutoscalerModalProps) => {
    const [minReplicas, setMinReplicas] = React.useState(1);
    const [maxReplicas, setMaxReplicas] = React.useState(12);

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

    const createAutoscaler = (): Promise<K8sResourceKind> => {
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
    };

    const submit = (event): void => {
      event.preventDefault();
      const { close } = props;
      const promise = createAutoscaler();
      props.handlePromise(promise, (obj: K8sResourceKind) => {
        close();
        history.push(
          resourcePathFromModel(MachineAutoscalerModel, obj.metadata.name, obj.metadata.namespace),
        );
      });
    };

    const {
      machineSet: {
        metadata: { name },
      },
      inProgress,
      errorMessage,
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
  },
);

export const configureMachineAutoscalerModal = createModalLauncher(ConfigureMachineAutoscalerModal);

type ConfigureMachineAutoscalerModalProps = {
  machineSet: K8sResourceKind;
  cancel: () => void;
  close: () => void;
  inProgress: boolean;
  errorMessage?: string;
} & HandlePromiseProps;
