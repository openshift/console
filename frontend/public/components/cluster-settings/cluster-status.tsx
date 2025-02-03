import { Button, Popover } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { HashLink } from 'react-router-hash-link';

import { SyncAltIcon } from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';

import {
  BlueArrowCircleUpIcon,
  BlueInfoCircleIcon,
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
} from '@console/shared';
import { ClusterVersionModel } from '../../models';
import {
  ClusterUpdateStatus,
  ClusterVersionConditionType,
  ClusterVersionKind,
  getClusterUpdateStatus,
  getClusterVersionCondition,
  getDesiredClusterVersion,
  k8sPatch,
  K8sResourceConditionStatus,
} from '../../module/k8s';
import { errorModal } from '../modals';
import { resourcePathFromModel, truncateMiddle } from '../utils';

export const ClusterVersionConditionsLink: React.FC<ClusterVersionConditionsLinkProps> = ({
  cv,
}) => {
  const { t } = useTranslation();
  return (
    <HashLink
      smooth
      to={`${resourcePathFromModel(ClusterVersionModel, cv.metadata.name)}#conditions`}
    >
      {t('public~View conditions')}
    </HashLink>
  );
};

const cancelUpdate = (cv: ClusterVersionKind) => {
  k8sPatch(ClusterVersionModel, cv, [{ path: '/spec/desiredUpdate', op: 'remove' }]).catch(
    (err) => {
      const error = err.message;
      errorModal({ error });
    },
  );
};

const StatusMessagePopover: React.FC<CVStatusMessagePopoverProps> = ({ bodyContent, children }) => {
  return (
    <Popover bodyContent={truncateMiddle(bodyContent, { length: 256 })}>
      <Button variant="link" isInline>
        <span>{children}</span>
      </Button>
    </Popover>
  );
};

const InvalidMessage: React.FC<CVStatusMessageProps> = ({ cv }) => {
  const { t } = useTranslation();
  return (
    <div data-test="cv-update-status-invalid">
      <div>
        <RedExclamationCircleIcon /> {t('public~Invalid cluster version')}
      </div>
      <Button onClick={() => cancelUpdate(cv)} variant="primary" className="pf-v6-u-mt-xs">
        {t('public~Cancel update')}
      </Button>
    </div>
  );
};

const ReleaseNotAcceptedMessage: React.FC<CVStatusMessageProps> = ({ cv }) => {
  const releaseNotAcceptedCondition = getClusterVersionCondition(
    cv,
    ClusterVersionConditionType.ReleaseAccepted,
    K8sResourceConditionStatus.False,
  );
  const { t } = useTranslation();
  return (
    <>
      <div data-test="cv-update-status-release-accepted-false">
        <StatusMessagePopover bodyContent={releaseNotAcceptedCondition.message}>
          <RedExclamationCircleIcon /> {t('public~Release not accepted')}
        </StatusMessagePopover>
      </div>
      <ClusterVersionConditionsLink cv={cv} />
    </>
  );
};

const UpdatesAvailableMessage: React.FC<CVStatusMessageProps> = () => {
  const { t } = useTranslation();
  return (
    <div className="co-update-status" data-test="cv-update-status-available-updates">
      <BlueArrowCircleUpIcon /> {t('public~Available updates')}
    </div>
  );
};

const FailingMessageText: React.FC<CVStatusMessageProps> = ({ cv }) => {
  const failingCondition = getClusterVersionCondition(
    cv,
    ClusterVersionConditionType.Failing,
    K8sResourceConditionStatus.True,
  );
  const { t } = useTranslation();
  return (
    <div data-test="cv-update-status-failing">
      <StatusMessagePopover bodyContent={failingCondition.message}>
        <RedExclamationCircleIcon /> {t('public~Failing')}
      </StatusMessagePopover>
    </div>
  );
};

export const UpdatingMessageText: React.FC<CVStatusMessageProps> = ({ cv }) => {
  const version = getDesiredClusterVersion(cv);
  const { t } = useTranslation();
  return <>{t('public~Update to {{version}} in progress', { version })}</>;
};

const UpdatingMessage: React.FC<CVStatusMessageProps> = ({ cv, isFailing }) => {
  return (
    <>
      <div data-test="cv-update-status-updating">
        <SyncAltIcon className="co-spin co-icon-space-r" />
        <UpdatingMessageText cv={cv} />
      </div>
      {isFailing && <FailingMessageText cv={cv} />}
      <ClusterVersionConditionsLink cv={cv} />
    </>
  );
};

const ErrorRetrievingMessage: React.FC<CVStatusMessageProps> = ({ cv }) => {
  const retrievedUpdatesCondition = getClusterVersionCondition(
    cv,
    ClusterVersionConditionType.RetrievedUpdates,
    K8sResourceConditionStatus.False,
  );
  const { t } = useTranslation();
  return retrievedUpdatesCondition.reason === 'NoChannel' ? (
    <div data-test="cv-update-status-no-channel">
      <BlueInfoCircleIcon /> {retrievedUpdatesCondition.message}
    </div>
  ) : (
    <>
      <div data-test="cv-update-status-no-updates">
        <StatusMessagePopover bodyContent={retrievedUpdatesCondition.message}>
          <RedExclamationCircleIcon /> {t('public~Not retrieving updates')}
        </StatusMessagePopover>
      </div>
      <ClusterVersionConditionsLink cv={cv} />
    </>
  );
};

const FailingMessage: React.FC<CVStatusMessageProps> = ({ cv }) => {
  return (
    <>
      <FailingMessageText cv={cv} />
      <ClusterVersionConditionsLink cv={cv} />
    </>
  );
};

export const UpToDateMessage: React.FC<{}> = () => {
  const { t } = useTranslation();
  return (
    <span data-test="cv-update-status-up-to-date">
      <GreenCheckCircleIcon /> {t('public~Up to date')}
    </span>
  );
};

export const UpdateStatus: React.FC<UpdateStatusProps> = ({ cv }) => {
  const status = getClusterUpdateStatus(cv);
  switch (status) {
    case ClusterUpdateStatus.Invalid:
      return <InvalidMessage cv={cv} />;
    case ClusterUpdateStatus.ReleaseNotAccepted:
      return <ReleaseNotAcceptedMessage cv={cv} />;
    case ClusterUpdateStatus.UpdatesAvailable:
      return <UpdatesAvailableMessage cv={cv} />;
    case ClusterUpdateStatus.Updating:
      return <UpdatingMessage cv={cv} />;
    case ClusterUpdateStatus.UpdatingAndFailing:
      return <UpdatingMessage cv={cv} isFailing />;
    case ClusterUpdateStatus.ErrorRetrieving:
      return <ErrorRetrievingMessage cv={cv} />;
    case ClusterUpdateStatus.Failing:
      return <FailingMessage cv={cv} />;
    default:
      return <UpToDateMessage />;
  }
};

type UpdateStatusProps = {
  cv: ClusterVersionKind;
};

type CVStatusMessagePopoverProps = {
  bodyContent: string;
  children: React.ReactNode;
};

type CVStatusMessageProps = {
  cv: ClusterVersionKind;
  isFailing?: boolean;
};

type ClusterVersionConditionsLinkProps = {
  cv: ClusterVersionKind;
};
