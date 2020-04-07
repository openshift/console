import * as React from 'react';
import { FormGroup, Checkbox, HelpBlock } from 'patternfly-react';
import { Alert, Button } from '@patternfly/react-core';
import {
  withHandlePromise,
  Firehose,
  FirehoseResult,
  HandlePromiseProps,
} from '@console/internal/components/utils';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory';
import { powerOffHost } from '../../k8s/requests/bare-metal-host';
import {
  NODE_STATUS_UNDER_MAINTENANCE,
  HOST_STATUS_READY,
  HOST_STATUS_AVAILABLE,
  NODE_STATUS_STARTING_MAINTENANCE,
  HOST_STATUS_UNKNOWN,
  HOST_HEALTH_ERROR,
  NODE_STATUS_STOPPING_MAINTENANCE,
} from '../../constants';
import { BareMetalHostKind } from '../../types';
import { startNodeMaintenanceModal } from './StartNodeMaintenanceModal';
import { StatusProps } from '../types';
import { PodKind } from '@console/internal/module/k8s';
import { PodModel, DaemonSetModel } from '@console/internal/models';

import './PowerOffHostModal.scss';

type SafePowerOffDialogProps = { isUnderMaintenance: boolean };

const SafePowerOffDialog: React.FC<SafePowerOffDialogProps> = ({ isUnderMaintenance }) => (
  <p>
    Host is ready to be gracefully powered off.{' '}
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
  status: StatusProps;
  nodePods?: FirehoseResult<PodKind[]>;
  loadError?: any;
};

const ForcePowerOffDialog: React.FC<ForcePowerOffDialogProps> = ({
  canStartMaintenance,
  forceOff,
  nodeName,
  setForceOff,
  status,
  nodePods,
  loadError,
}) => {
  const mainText = nodeName ? (
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
  ) : (
    <p>The host will be powered off gracefully.</p>
  );

  const helpText = nodeName
    ? 'Workloads will not be moved before the host powers off.'
    : 'The host will power off immediately as if it were unplugged.';

  return (
    <>
      {mainText}
      <StatusValidations status={status.status} nodePods={nodePods} loadError={loadError} />
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

type StatusValidationProps = {
  status: string;
  nodePods: FirehoseResult<PodKind[]>;
  loadError?: any;
};

const StatusValidations: React.FC<StatusValidationProps> = ({ status, nodePods, loadError }) => {
  const validations = [];

  if (loadError) {
    validations.push({
      title: 'Failed to load data.',
      description: 'Failed to load subresources.',
      level: 'danger',
    });
  }

  if ([HOST_STATUS_UNKNOWN, ...HOST_HEALTH_ERROR].includes(status)) {
    validations.push({
      title: 'The bare metal host is not healthy.',
      description: 'The host cannot be powered off gracefully untils its health is restored.',
      level: 'warning',
    });
  }

  if (status === NODE_STATUS_STARTING_MAINTENANCE) {
    validations.push({
      title: 'The node is starting maintenance.',
      description:
        'The node cannot be powered off gracefully until it finishes entering maintenance.',
      level: 'info',
    });
  }

  if (status === NODE_STATUS_STOPPING_MAINTENANCE) {
    validations.push({
      title: 'The node is stopping maintenance.',
      description: 'The node cannot be powered off gracefully while it is exiting maintenance.',
      level: 'info',
    });
  }

  if (
    nodePods?.data?.find((pod) =>
      pod.metadata?.ownerReferences.find((or) => or.kind === DaemonSetModel.kind),
    )
  ) {
    validations.push({
      title: 'This node contains DaemonSet pods.',
      description:
        'These DaemonSets will prevent some pods from being moved. This should not prevent the host from powering off gracefully.',
      level: 'info',
    });
  }

  return (
    <>
      {validations.map((validation) => (
        <Alert variant={validation.level} isInline title={validation.title} key={validation.title}>
          {validation.description}
        </Alert>
      ))}
    </>
  );
};

export type PowerOffHostModalProps = {
  host: BareMetalHostKind;
  hasNodeMaintenanceCapability: boolean;
  nodeName: string;
  status: StatusProps;
  cancel?: () => void;
  close?: () => void;
  nodePods?: FirehoseResult<PodKind[]>;
  loadError?: any;
  loaded?: boolean;
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
    nodePods,
    loadError,
  }: PowerOffHostModalProps & HandlePromiseProps) => {
    const [canPowerOffSafely, setCanPowerOffSafely] = React.useState(false);
    const [forceOff, setForceOff] = React.useState(false);

    React.useEffect(() => {
      isPowerOffSafe(status.status) && setCanPowerOffSafely(true);
    }, [status]);

    React.useEffect(() => {
      !canPowerOffSafely && setForceOff(false);
    }, [canPowerOffSafely]);

    const submit = (event) => {
      event.preventDefault();
      const promise = powerOffHost(host);
      return handlePromise(promise).then(close);
    };

    const isUnderMaintenance = status.status === NODE_STATUS_UNDER_MAINTENANCE;
    return (
      <form onSubmit={submit} name="form" className="modal-content metal3-poweroff-modal">
        <ModalTitle>Power Off Host</ModalTitle>
        <ModalBody>
          {canPowerOffSafely ? (
            <SafePowerOffDialog isUnderMaintenance={isUnderMaintenance} />
          ) : (
            <ForcePowerOffDialog
              forceOff={forceOff}
              setForceOff={setForceOff}
              canStartMaintenance={!isUnderMaintenance && nodeName && hasNodeMaintenanceCapability}
              nodeName={nodeName}
              status={status}
              nodePods={nodePods}
              loadError={loadError}
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

const PowerOffHostModalFirehose = (props: PowerOffHostModalProps) => {
  const { nodeName } = props;

  const resources = [];
  resources.push({
    kind: PodModel.kind,
    namespaced: false,
    isList: true,
    prop: 'nodePods',
    fieldSelector: `spec.nodeName=${nodeName}`,
  });

  return (
    <Firehose resources={resources}>
      <PowerOffHostModal {...props} />
    </Firehose>
  );
};

export const powerOffHostModal = createModalLauncher(PowerOffHostModalFirehose);
