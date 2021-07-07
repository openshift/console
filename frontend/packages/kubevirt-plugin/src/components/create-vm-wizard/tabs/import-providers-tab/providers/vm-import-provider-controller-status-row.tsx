import * as React from 'react';
import { Alert, AlertVariant } from '@patternfly/react-core';
import { InProgressIcon } from '@patternfly/react-icons';
import classNames from 'classnames';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { resourcePath } from '@console/internal/components/utils';
import { DeploymentModel, PodModel } from '@console/internal/models';
import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import StatusIconAndText from '@console/shared/src/components/status/StatusIconAndText';
import { getName, getNamespace } from '../../../../../selectors';
import { PodDeploymentStatus } from '../../../../../statuses/pod-deployment/constants';
import { getPodDeploymentStatus } from '../../../../../statuses/pod-deployment/pod-deployment-status';
import { prefixedID } from '../../../../../utils';
import { iGet, immutableListToShallowJS, toShallowJS } from '../../../../../utils/immutable';
import { FormRow } from '../../../../form/form-row';
import { iGetProviderFieldAttribute } from '../../../selectors/immutable/provider/common';
import { iGetCommonData, iGetLoadedCommonData } from '../../../selectors/immutable/selectors';
import { getProviderName } from '../../../strings/import-providers';
import {
  OvirtProviderField,
  OvirtProviderProps,
  VMImportProvider,
  VMWareProviderField,
  VMWareProviderProps,
} from '../../../types';

const DeploymentLink: React.FC<DeploymentLinkProps> = ({ deployment }) => {
  const name = getName(deployment);
  const eventsLink = `${resourcePath(DeploymentModel.kind, name, getNamespace(deployment))}/events`;

  return <Link to={eventsLink}>{name}</Link>;
};

type DeploymentLinkProps = {
  deployment: K8sResourceKind;
};

const NoDeployment: React.FC<NoDeploymentProps> = ({ provider }) => {
  const { t } = useTranslation();
  const providerName = getProviderName(provider);
  return (
    <StatusIconAndText
      spin
      noTooltip
      title={t('kubevirt-plugin~Starting {{providerName}} controller', { providerName })}
      icon={<InProgressIcon />}
    />
  );
};

type NoDeploymentProps = {
  id: string;
  provider: VMImportProvider;
};

const DeploymentProgressing: React.FC<DeploymentProgressingProps> = ({
  id,
  provider,
  deployment,
}) => {
  const icon = <InProgressIcon />;
  const { t } = useTranslation();
  // TODO reuse StatusComponent
  return (
    <span id={id} className="co-icon-and-text">
      {React.cloneElement(icon, {
        className: classNames(
          'fa-spin co-icon-and-text__icon co-icon-flex-child',
          icon.props.className,
        ),
      })}{' '}
      {t('kubevirt-plugin~Deploying {{providerName}} controller', {
        providerName: getProviderName(provider),
      })}{' '}
      <DeploymentLink deployment={deployment} />
    </span>
  );
};

type DeploymentProgressingProps = {
  deployment: K8sResourceKind;
  provider: VMImportProvider;
  id: string;
};

const DeploymentFailed: React.FC<DeploymentFailedProps> = ({
  id,
  provider,
  deployment,
  pod,
  message,
}) => {
  const { t } = useTranslation();
  let podMessage;
  if (pod) {
    const podName = getName(deployment);
    const podLink = `${resourcePath(PodModel.kind, podName, getNamespace(pod))}/events`;
    podMessage = (
      <>
        {' '}
        <Trans t={t} ns="kubevirt-plugin">
          Please inspect a failing pod <Link to={podLink}>{podName}</Link>
        </Trans>
      </>
    );
  }
  return (
    <Alert
      id={id}
      variant={AlertVariant.danger}
      title={
        <Trans t={t} ns="kubevirt-plugin">
          Deployment of {{ providerName: getProviderName(provider) }} controller{' '}
          <DeploymentLink deployment={deployment} /> failed
        </Trans>
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
  [PodDeploymentStatus.PROGRESSING.getValue()]: DeploymentProgressing,
  [PodDeploymentStatus.POD_FAILED.getValue()]: DeploymentFailed,
  [PodDeploymentStatus.FAILED.getValue()]: DeploymentFailed,
};

const VmwareControllerStatusRowComponent: React.FC<VmwareControllerStatusRowComponentProps> = React.memo(
  ({ id, hasErrors, deployment, deploymentPods, provider }) => {
    const status = getPodDeploymentStatus(
      toShallowJS(deployment, undefined, true),
      immutableListToShallowJS(deploymentPods),
    );
    if (
      hasErrors ||
      status.status === PodDeploymentStatus.ROLLOUT_COMPLETE ||
      ([PodDeploymentStatus.FAILED, PodDeploymentStatus.UNKNOWN].includes(status.status) &&
        hasErrors) // deployment failed
    ) {
      return null;
    }

    const StatusComponent = vmwareStatusComponentResolver[status.status.getValue()] || NoDeployment;

    return (
      <FormRow fieldId={prefixedID(id, 'status')}>
        <StatusComponent provider={provider} id={prefixedID(id, 'status')} {...status} />
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
  provider: VMImportProvider;
};

const stateToProps = (state, { wizardReduxID, provider }) => {
  // status doesn't mind loaded failed
  const deployment = iGet(
    iGetCommonData(
      state,
      wizardReduxID,
      provider === VMImportProvider.OVIRT
        ? OvirtProviderProps.deployment
        : VMWareProviderProps.deployment,
    ),
    'data',
  );
  return {
    hasErrors: !!iGetProviderFieldAttribute(
      state,
      wizardReduxID,
      provider,
      'errors',
      OvirtProviderField.CONTROLLER_LAST_ERROR,
      VMWareProviderField.CONTROLLER_LAST_ERROR,
    ),
    deployment: _.isEmpty(deployment) ? undefined : deployment,
    deploymentPods: iGetLoadedCommonData(
      state,
      wizardReduxID,
      provider === VMImportProvider.OVIRT
        ? OvirtProviderProps.deploymentPods
        : VMWareProviderProps.deploymentPods,
    ),
  };
};

export const VMImportProviderControllerStatusRow = connect(stateToProps)(
  VmwareControllerStatusRowComponent,
);
