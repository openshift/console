import * as React from 'react';
import { FormGroup, Checkbox, HelpBlock } from 'patternfly-react';
import { Alert, Button } from '@patternfly/react-core';
import {
  withHandlePromise,
  HandlePromiseProps,
  LoadingBox,
} from '@console/internal/components/utils';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory';
import { PodModel } from '@console/internal/models';
import { PodKind } from '@console/internal/module/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { powerOffHost } from '../../k8s/requests/bare-metal-host';
import {
  NODE_STATUS_UNDER_MAINTENANCE,
  HOST_STATUS_READY,
  HOST_STATUS_AVAILABLE,
  NODE_STATUS_STARTING_MAINTENANCE,
  NODE_STATUS_STOPPING_MAINTENANCE,
} from '../../constants';
import { BareMetalHostKind } from '../../types';
import { startNodeMaintenanceModal } from './StartNodeMaintenanceModal';
import { StatusProps } from '../types';
import { StatusValidations, getStaticPods, getDaemonSetsOfPods } from './PowerOffStatusValidations';
import { useMaintenanceCapability } from '../../hooks/useMaintenanceCapability';

const getPowerOffMessage = (pods: PodKind[]) => {
  const staticPods = getStaticPods(pods);
  const daemonSets = getDaemonSetsOfPods(pods);
  if (!staticPods.length && !daemonSets.length) {
    return 'all workloads have already been moved.';
  }
  let desc = 'all workloads have already been moved, but ';
  if (staticPods.length) {
    desc += `${staticPods.length} static pods`;
  }
  if (daemonSets.length) {
    if (staticPods.length) {
      desc += ` and `;
    }
    desc += `${daemonSets.length} daemon sets`;
  }
  desc += ' have been skipped.';
  return desc;
};

type SafePowerOffDialogProps = { isUnderMaintenance: boolean; pods?: PodKind[] };

const SafePowerOffDialog: React.FC<SafePowerOffDialogProps> = ({ isUnderMaintenance, pods }) => (
  <p>
    Host is ready to be gracefully powered off.{' '}
    {isUnderMaintenance && (
      <p>The host is currently under maintenance and {getPowerOffMessage(pods)}</p>
    )}
  </p>
);

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
  const hasMaintenance = [
    NODE_STATUS_STARTING_MAINTENANCE,
    NODE_STATUS_UNDER_MAINTENANCE,
    NODE_STATUS_STOPPING_MAINTENANCE,
  ].includes(status.status);
  let mainText: React.ReactNode;
  if (!nodeName) {
    mainText = <p>The host will be powered off gracefully.</p>;
  } else if (!hasMaintenance) {
    mainText = (
      <p>
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
      </p>
    );
  }

  const helpText = nodeName
    ? 'Workloads will not be moved before the host powers off.'
    : 'The host will power off immediately as if it were unplugged.';

  return (
    <>
      {mainText}
      <StatusValidations
        status={status.status}
        nodePods={pods}
        loadError={loadError}
        onLinkClicked={cancel}
      />
      <div className="form-group">
        <FormGroup controlId="host-force-off">
          <Checkbox onChange={() => setForceOff(!forceOff)} checked={forceOff} inline>
            Power off immediately
          </Checkbox>
          <HelpBlock id="host-force-off-help">{helpText}</HelpBlock>
        </FormGroup>
        {forceOff && (
          <Alert variant="warning" title="Applications may be temporarily disrupted." isInline>
            Workloads currently running on this host will not be moved before powering off. This may
            cause service disruptions.
          </Alert>
        )}
      </div>
    </>
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
        <ModalTitle>Power Off Host</ModalTitle>
        <ModalBody>
          {!loaded ? (
            <LoadingBox />
          ) : canPowerOffSafely ? (
            <SafePowerOffDialog isUnderMaintenance={isUnderMaintenance} pods={pods} />
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
          submitText="Power Off"
        />
      </form>
    );
  },
);

export const powerOffHostModal = createModalLauncher(PowerOffHostModal);
