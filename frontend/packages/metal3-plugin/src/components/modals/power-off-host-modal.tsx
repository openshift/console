import * as React from 'react';
import { FormGroup, Checkbox, HelpBlock } from 'patternfly-react';
import { Alert, Button } from '@patternfly/react-core';
import { withHandlePromise } from '@console/internal/components/utils';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getName } from '@console/shared';
import { powerOffHost } from '../../k8s/requests/host-power-operations';
import { HOST_STATUS_UNDER_MAINTENANCE, HOST_STATUS_READY } from '../../constants';
import { startNodeMaintenanceModal } from './start-node-maintenance-modal';

type SafePowerOffDialogProps = { isUnderMaintenance: boolean };

const SafePowerOffDialog: React.FC<SafePowerOffDialogProps> = ({ isUnderMaintenance }) => (
  <p>
    Host is ready to be shut down gracefully.{' '}
    {isUnderMaintenance && (
      <>The host is currently under maintenance and all workloads have already been moved.</>
    )}
  </p>
);

type ForcePowerOffDialogProps = {
  canStartMaintenance: boolean;
  forceOff: boolean;
  nodeName: string;
  setForceOff: React.Dispatch<React.SetStateAction<boolean>>;
};

const ForcePowerOffDialog: React.FC<ForcePowerOffDialogProps> = ({
  canStartMaintenance,
  forceOff,
  nodeName,
  setForceOff,
}) => {
  return (
    <>
      <p>
        To shut down gracefully,{' '}
        <Button
          variant="link"
          onClick={() => startNodeMaintenanceModal({ nodeName })}
          isDisabled={!canStartMaintenance}
          isInline
        >
          start maintenance
        </Button>{' '}
        on this host to move all managed workloads to other hosts in the cluster.
      </p>
      <div className="form-group">
        <FormGroup controlId="host-force-off">
          <Checkbox onChange={() => setForceOff(!forceOff)} checked={forceOff} inline>
            Shut down immediately
          </Checkbox>
          <HelpBlock id="host-force-off-help">
            Workloads and data won&apos;t be moved before shutting down.
          </HelpBlock>
        </FormGroup>
        {forceOff && (
          <Alert variant="warning" title="Applications may be temporarily disrupted.">
            Workloads currently running on this host will not be moved before shutting down. This
            may cause service disruptions.
          </Alert>
        )}
      </div>
    </>
  );
};

const isPowerOffSafe = (status: string) => {
  const safeStates = [HOST_STATUS_UNDER_MAINTENANCE, HOST_STATUS_READY];
  return safeStates.includes(status);
};

export type PowerOffHostModalProps = {
  host: K8sResourceKind;
  hasNodeMaintenanceCapability: boolean;
  nodeName: string;
  status: string;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  inProgress: boolean;
  errorMessage: string;
  cancel?: () => void;
  close?: () => void;
};

const PowerOffHostModal = withHandlePromise(
  ({
    hasNodeMaintenanceCapability,
    host,
    nodeName,
    status,
    inProgress,
    errorMessage,
    handlePromise,
    close = undefined,
    cancel = undefined,
  }: PowerOffHostModalProps) => {
    const name = getName(host);
    const [canPowerOffSafely, setCanPowerOffSafely] = React.useState(false);
    const [forceOff, setForceOff] = React.useState(false);

    React.useEffect(() => {
      isPowerOffSafe(status) && setCanPowerOffSafely(true);
    }, [status]);

    React.useEffect(() => {
      !canPowerOffSafely && setForceOff(false);
    }, [canPowerOffSafely]);

    const submit = (event) => {
      event.preventDefault();
      const promise = powerOffHost(host);
      return handlePromise(promise).then(close);
    };

    const title = `Shut down`;
    const isUnderMaintenance = status === HOST_STATUS_UNDER_MAINTENANCE;
    return (
      <form onSubmit={submit} name="form" className="modal-content">
        <ModalTitle>
          {title} {name}
        </ModalTitle>
        <ModalBody>
          {canPowerOffSafely ? (
            <SafePowerOffDialog isUnderMaintenance={isUnderMaintenance} />
          ) : (
            <ForcePowerOffDialog
              forceOff={forceOff}
              setForceOff={setForceOff}
              canStartMaintenance={!isUnderMaintenance && nodeName && hasNodeMaintenanceCapability}
              nodeName={nodeName}
            />
          )}
        </ModalBody>
        <ModalSubmitFooter
          cancel={cancel}
          errorMessage={errorMessage}
          inProgress={inProgress}
          submitDisabled={!canPowerOffSafely && !forceOff}
          submitText={title}
        />
      </form>
    );
  },
);

export const powerOffHostModal = createModalLauncher(PowerOffHostModal);
