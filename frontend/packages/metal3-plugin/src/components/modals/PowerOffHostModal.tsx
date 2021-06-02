import * as React from 'react';
import { Alert, Button, Stack, StackItem, Checkbox } from '@patternfly/react-core';
import { TFunction } from 'i18next';
import { Trans, useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory';
import {
  withHandlePromise,
  HandlePromiseProps,
  LoadingBox,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { PodModel } from '@console/internal/models';
import { PodKind } from '@console/internal/module/k8s';
import {
  NODE_STATUS_UNDER_MAINTENANCE,
  HOST_STATUS_READY,
  HOST_STATUS_AVAILABLE,
  NODE_STATUS_STARTING_MAINTENANCE,
  NODE_STATUS_STOPPING_MAINTENANCE,
} from '../../constants';
import { useMaintenanceCapability } from '../../hooks/useMaintenanceCapability';
import { powerOffHost } from '../../k8s/requests/bare-metal-host';
import { BareMetalHostKind } from '../../types';
import { StatusProps } from '../types';
import { StatusValidations, getStaticPods, getDaemonSetsOfPods } from './PowerOffStatusValidations';
import { startNodeMaintenanceModal } from './StartNodeMaintenanceModal';

type PowerOffWarning = {
  restart?: boolean;
};

export const PowerOffWarning: React.FC<PowerOffWarning> = ({ restart }) => {
  const { t } = useTranslation();
  return (
    <Alert
      variant="warning"
      title={t('metal3-plugin~Applications may be temporarily disrupted.')}
      isInline
    >
      {restart
        ? t(
            'metal3-plugin~Workloads currently running on this host will not be moved before restarting. This may cause service disruptions.',
          )
        : t(
            'metal3-plugin~Workloads currently running on this host will not be moved before powering off. This may cause service disruptions.',
          )}
    </Alert>
  );
};

const getPowerOffMessage = (t: TFunction, pods: PodKind[]) => {
  const staticPods = getStaticPods(pods);
  const daemonSets = getDaemonSetsOfPods(pods);
  if (!staticPods.length && !daemonSets.length) {
    return t('metal3-plugin~all workloads have already been moved.');
  }
  if (staticPods.length && !daemonSets.length) {
    return t(
      'metal3-plugin~all workloads have already been moved, but {{length}} static pods have been skipped.',
      { length: staticPods.length },
    );
  }
  if (!staticPods.length && daemonSets.length) {
    return t(
      'metal3-plugin~all workloads have already been moved, but {{length}} daemon sets have been skipped.',
      { length: daemonSets.length },
    );
  }

  return t(
    'metal3-plugin~all workloads have already been moved, but {{podListlength}} static pods and {{daemonListlength}} daemon sets have been skipped.',
    { podListlength: staticPods.length, daemonListlength: daemonSets.length },
  );
};

type ForcePowerOffDialogProps = {
  canStartMaintenance: boolean;
  forceOff: boolean;
  nodeName: string;
  setForceOff: React.Dispatch<React.SetStateAction<boolean>>;
  status: StatusProps;
  pods?: PodKind[];
  loadError?: any;
  cancel?: () => void;
};

const ForcePowerOffDialog: React.FC<ForcePowerOffDialogProps> = ({
  canStartMaintenance,
  forceOff,
  nodeName,
  setForceOff,
  status,
  pods,
  loadError,
  cancel,
}) => {
  const { t } = useTranslation();
  const hasMaintenance = [
    NODE_STATUS_STARTING_MAINTENANCE,
    NODE_STATUS_UNDER_MAINTENANCE,
    NODE_STATUS_STOPPING_MAINTENANCE,
  ].includes(status.status);
  let mainText: React.ReactNode;
  if (!nodeName) {
    mainText = <p>{t('metal3-plugin~The host will be powered off gracefully.')}</p>;
  } else if (!hasMaintenance) {
    mainText = (
      <p>
        <Trans ns="metal3-plugin">
          To power off gracefully,{' '}
          <Button
            variant="link"
            onClick={() => startNodeMaintenanceModal({ nodeName })}
            isDisabled={!canStartMaintenance}
            isInline
          >
            start maintenance
          </Button>{' '}
          on this host to move all managed workloads to other nodes in the cluster.
        </Trans>
      </p>
    );
  }

  const helpText = nodeName
    ? t('metal3-plugin~Workloads will not be moved before the host powers off.')
    : t('metal3-plugin~The host will power off immediately as if it were unplugged.');

  return (
    <Stack hasGutter>
      <StackItem>
        {mainText}
        <StatusValidations
          status={status.status}
          nodePods={pods}
          loadError={loadError}
          onLinkClicked={cancel}
        />
      </StackItem>
      <StackItem>
        <Checkbox
          id="host-force-off"
          label={t('metal3-plugin~Power off immediately')}
          onChange={setForceOff}
          isChecked={forceOff}
        />
        <div className="text-secondary">{helpText}</div>
      </StackItem>
      <StackItem>{forceOff && <PowerOffWarning />}</StackItem>
    </Stack>
  );
};

const isPowerOffSafe = (status: string) => {
  const safeStates = [NODE_STATUS_UNDER_MAINTENANCE, HOST_STATUS_READY, HOST_STATUS_AVAILABLE];
  return safeStates.includes(status);
};

export type PowerOffHostModalProps = {
  host: BareMetalHostKind;
  nodeName: string;
  status: StatusProps;
  cancel?: () => void;
  close?: () => void;
};

const PowerOffHostModal = withHandlePromise<PowerOffHostModalProps & HandlePromiseProps>(
  ({ host, nodeName, status, inProgress, errorMessage, handlePromise, close, cancel }) => {
    const [pods, loaded, loadError] = useK8sWatchResource<PodKind[]>({
      kind: PodModel.kind,
      namespaced: false,
      isList: true,
      fieldSelector: `spec.nodeName=${nodeName}`,
    });
    const { t } = useTranslation();
    const [hasNodeMaintenanceCapability] = useMaintenanceCapability();
    const [forceOff, setForceOff] = React.useState(false);

    const submit = (event) => {
      event.preventDefault();
      const promise = powerOffHost(host);
      return handlePromise(promise, close);
    };

    const canPowerOffSafely = !loadError && isPowerOffSafe(status.status);

    const isUnderMaintenance = status.status === NODE_STATUS_UNDER_MAINTENANCE;
    return (
      <form onSubmit={submit} name="form" className="modal-content">
        <ModalTitle>{t('metal3-plugin~Power Off Host')}</ModalTitle>
        <ModalBody>
          {!loaded ? (
            <LoadingBox />
          ) : canPowerOffSafely ? (
            isUnderMaintenance ? (
              t(
                'metal3-plugin~Host is ready to be gracefully powered off. The host is currently under maintenance and {{message}}',
                { message: getPowerOffMessage(t, pods) },
              )
            ) : (
              t('metal3-plugin~Host is ready to be gracefully powered off.')
            )
          ) : (
            <ForcePowerOffDialog
              forceOff={forceOff}
              setForceOff={setForceOff}
              canStartMaintenance={!isUnderMaintenance && nodeName && hasNodeMaintenanceCapability}
              nodeName={nodeName}
              status={status}
              pods={pods}
              loadError={loadError}
              cancel={cancel}
            />
          )}
        </ModalBody>
        <ModalSubmitFooter
          cancel={cancel}
          errorMessage={errorMessage}
          inProgress={inProgress}
          submitDisabled={!canPowerOffSafely && !forceOff}
          submitText={t('metal3-plugin~Power Off')}
        />
      </form>
    );
  },
);

export const powerOffHostModal = createModalLauncher(PowerOffHostModal);
