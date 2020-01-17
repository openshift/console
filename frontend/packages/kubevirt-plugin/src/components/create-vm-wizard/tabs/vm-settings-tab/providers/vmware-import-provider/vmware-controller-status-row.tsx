import * as React from 'react';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import { Alert, AlertVariant } from '@patternfly/react-core';
import { InProgressIcon } from '@patternfly/react-icons';
import { connect } from 'react-redux';
import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { resourcePath } from '@console/internal/components/utils';
import { DeploymentModel, PodModel } from '@console/internal/models';
import { getName, getNamespace } from '@console/shared/src';
import classNames from 'classnames';
import StatusIconAndText from '@console/shared/src/components/status/StatusIconAndText';
import { prefixedID } from '../../../../../../utils';
import { FormRow } from '../../../../../form/form-row';
import {
  getV2vVMwareDeploymentStatus,
  V2VVMWareDeploymentStatus,
} from '../../../../../../statuses/v2vvmware-deployment';
import { iGetCommonData, iGetLoadedCommonData } from '../../../../selectors/immutable/selectors';
import { VMWareProviderField, VMWareProviderProps } from '../../../../types';
import { iGetVMWareFieldAttribute } from '../../../../selectors/immutable/provider/vmware/selectors';
import { iGet, immutableListToShallowJS, toShallowJS } from '../../../../../../utils/immutable';

const DeploymentLink: React.FC<DeploymentLinkProps> = ({ deployment }) => {
  const name = getName(deployment);
  const eventsLink = `${resourcePath(DeploymentModel.kind, name, getNamespace(deployment))}/events`;

  return <Link to={eventsLink}>{name}</Link>;
};

type DeploymentLinkProps = {
  deployment: K8sResourceKind;
};

const NoDeployment: React.FC<NoDeploymentProps> = () => (
  <StatusIconAndText spin noTooltip title="Starting VMware controller" icon={<InProgressIcon />} />
);

type NoDeploymentProps = {
  id: string;
};

const DeploymentProgressing: React.FC<DeploymentProgressingProps> = ({ id, deployment }) => {
  const icon = <InProgressIcon />;
  // TODO reuse StatusComponent
  return (
    <span id={id} className="co-icon-and-text">
      {React.cloneElement(icon, {
        className: classNames(
          'fa-spin co-icon-and-text__icon co-icon-flex-child',
          icon.props.className,
        ),
      })}{' '}
      Deploying VMware controller (<DeploymentLink deployment={deployment} />)
    </span>
  );
};

type DeploymentProgressingProps = {
  deployment: K8sResourceKind;
  id: string;
};

const DeploymentFailed: React.FC<DeploymentFailedProps> = ({ id, deployment, pod, message }) => {
  let podMessage;
  if (pod) {
    const podName = getName(deployment);
    const podLink = `${resourcePath(PodModel.kind, podName, getNamespace(pod))}/events`;
    podMessage = (
      <>
        {' '}
        Please inspect a failing pod <Link to={podLink}>{podName}</Link>
      </>
    );
  }
  return (
    <Alert
      id={id}
      variant={AlertVariant.danger}
      title={
        <>
          Deployment of VMware controller <DeploymentLink deployment={deployment} /> failed
        </>
      }
    >
      {message}.{podMessage}
    </Alert>
  );
};

type DeploymentFailedProps = DeploymentProgressingProps & {
  pod: PodKind;
  message: string;
};

const vmwareStatusComponentResolver = {
  [V2VVMWareDeploymentStatus.PROGRESSING.getValue()]: DeploymentProgressing,
  [V2VVMWareDeploymentStatus.POD_FAILED.getValue()]: DeploymentFailed,
  [V2VVMWareDeploymentStatus.FAILED.getValue()]: DeploymentFailed,
};

const VmwareControllerStatusRowComponent: React.FC<VmwareControllerStatusRowComponentProps> = React.memo(
  ({ id, hasErrors, deployment, deploymentPods }) => {
    const status = getV2vVMwareDeploymentStatus(
      toShallowJS(deployment, undefined, true),
      immutableListToShallowJS(deploymentPods),
    );
    if (
      hasErrors ||
      status.status === V2VVMWareDeploymentStatus.ROLLOUT_COMPLETE ||
      ([V2VVMWareDeploymentStatus.FAILED, V2VVMWareDeploymentStatus.UNKNOWN].includes(
        status.status,
      ) &&
        hasErrors) // deployment failed
    ) {
      return null;
    }

    const StatusComponent = vmwareStatusComponentResolver[status.status.getValue()] || NoDeployment;

    return (
      <FormRow fieldId={prefixedID(id, 'status')}>
        <StatusComponent id={prefixedID(id, 'status')} {...status} />
      </FormRow>
    );
  },
);

type VmwareControllerStatusRowComponentProps = {
  id: string;
  hasErrors: boolean;
  deployment: any;
  deploymentPods: any;
  wizardReduxID: string;
};

const stateToProps = (state, { wizardReduxID }) => {
  // status doesn't mind loaded failed
  const deployment = iGet(
    iGetCommonData(state, wizardReduxID, VMWareProviderProps.deployment),
    'data',
  );
  return {
    hasErrors: !!iGetVMWareFieldAttribute(
      state,
      wizardReduxID,
      VMWareProviderField.V2V_LAST_ERROR,
      'errors',
    ),
    deployment: _.isEmpty(deployment) ? undefined : deployment,
    deploymentPods: iGetLoadedCommonData(state, wizardReduxID, VMWareProviderProps.deploymentPods),
  };
};

export const VMWareControllerStatusRow = connect(stateToProps)(VmwareControllerStatusRowComponent);
