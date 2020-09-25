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
import { PodModel } from '@console/internal/models';
import { useFlag } from '@console/shared/src/hooks/flag';
import { PodKind } from '@console/internal/module/k8s';
import { powerOffHost } from '../../k8s/requests/bare-metal-host';
import {
  NODE_STATUS_UNDER_MAINTENANCE,
  HOST_STATUS_READY,
  HOST_STATUS_AVAILABLE,
} from '../../constants';
import { BareMetalHostKind } from '../../types';
import { startNodeMaintenanceModal } from './StartNodeMaintenanceModal';
import { StatusProps } from '../types';
import { StatusValidations, getStaticPods } from './PowerOffStatusValidations';
import { NODE_MAINTENANCE_FLAG } from '../../features';

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
  cancel?: () => void;
};

const ForcePowerOffDialog: React.FC<ForcePowerOffDialogProps> = ({
  canStartMaintenance,
  forceOff,
  nodeName,
  setForceOff,
  status,
  nodePods,
  loadError,
  cancel,
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
      <StatusValidations
        status={status.status}
        nodePods={nodePods}
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

const isPowerOffSafe = (status: string, nodePods?: PodKind[]) => {
  const safeStates = [NODE_STATUS_UNDER_MAINTENANCE, HOST_STATUS_READY, HOST_STATUS_AVAILABLE];
  return safeStates.includes(status) && !getStaticPods(nodePods).length;
};

export type PowerOffHostModalProps = {
  host: BareMetalHostKind;
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
    const hasNodeMaintenanceCapability = useFlag(NODE_MAINTENANCE_FLAG);
    const [canPowerOffSafely, setCanPowerOffSafely] = React.useState(false);
    const [forceOff, setForceOff] = React.useState(false);

    React.useEffect(() => {
      isPowerOffSafe(status.status, nodePods?.data) && setCanPowerOffSafely(true);
    }, [status, nodePods]);

    React.useEffect(() => {
      !canPowerOffSafely && setForceOff(false);
    }, [canPowerOffSafely]);

    const submit = (event) => {
      event.preventDefault();
      const promise = powerOffHost(host);
      return handlePromise(promise, close);
    };

    const isUnderMaintenance = status.status === NODE_STATUS_UNDER_MAINTENANCE;
    return (
      <form onSubmit={submit} name="form" className="modal-content">
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
