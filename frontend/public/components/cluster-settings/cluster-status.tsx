import { Button, Popover } from '@patternfly/react-core';
import type { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { HashLink } from 'react-router-hash-link';

import { SyncAltIcon } from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';

import {
  BlueArrowCircleUpIcon,
  BlueInfoCircleIcon,
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
} from '@console/shared/src/components/status/icons';
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
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { resourcePathFromModel } from '../utils/resource-link';
import { truncateMiddle } from '../utils/truncate-middle';
import { ErrorModal, ErrorModalProps } from '../modals/error-modal';

export const ClusterVersionConditionsLink: FC<ClusterVersionConditionsLinkProps> = ({
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

const cancelUpdate = (
  cv: ClusterVersionKind,
  launchModal: (element: FC<ErrorModalProps>, props: ErrorModalProps) => void,
) => {
  k8sPatch(ClusterVersionModel, cv, [{ path: '/spec/desiredUpdate', op: 'remove' }]).catch(
    (err) => {
      const error = err.message;
      launchModal(ErrorModal, { error });
    },
  );
};

const StatusMessagePopover: Snail.FCC<CVStatusMessagePopoverProps> = ({
  bodyContent,
  children,
}) => {
  return (
    <Popover bodyContent={truncateMiddle(bodyContent, { length: 256 })}>
      <Button variant="link" isInline>
        <span>{children}</span>
      </Button>
    </Popover>
  );
};

const InvalidMessage: FC<CVStatusMessageProps> = ({ cv }) => {
  const { t } = useTranslation();
  const launchModal = useOverlay();
  return (
    <div data-test="cv-update-status-invalid">
      <div>
        <RedExclamationCircleIcon /> {t('public~Invalid cluster version')}
      </div>
      <Button
        onClick={() => cancelUpdate(cv, launchModal)}
        variant="primary"
        className="pf-v6-u-mt-xs"
      >
        {t('public~Cancel update')}
      </Button>
    </div>
  );
};

const ReleaseNotAcceptedMessage: FC<CVStatusMessageProps> = ({ cv }) => {
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

const UpdatesAvailableMessage: FC<CVStatusMessageProps> = () => {
  const { t } = useTranslation();
  return (
    <div className="co-update-status" data-test="cv-update-status-available-updates">
      <BlueArrowCircleUpIcon /> {t('public~Available updates')}
    </div>
  );
};

const FailingMessageText: FC<CVStatusMessageProps> = ({ cv }) => {
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

export const UpdatingMessageText: FC<CVStatusMessageProps> = ({ cv }) => {
  const version = getDesiredClusterVersion(cv);
  const { t } = useTranslation();
  return <>{t('public~Update to {{version}} in progress', { version })}</>;
};

const UpdatingMessage: FC<CVStatusMessageProps> = ({ cv, isFailing }) => {
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

const ErrorRetrievingMessage: FC<CVStatusMessageProps> = ({ cv }) => {
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

const FailingMessage: FC<CVStatusMessageProps> = ({ cv }) => {
  return (
    <>
      <FailingMessageText cv={cv} />
      <ClusterVersionConditionsLink cv={cv} />
    </>
  );
};

export const UpToDateMessage: FC<{}> = () => {
  const { t } = useTranslation();
  return (
    <span data-test="cv-update-status-up-to-date">
      <GreenCheckCircleIcon /> {t('public~Up to date')}
    </span>
  );
};

export const UpdateStatus: FC<UpdateStatusProps> = ({ cv }) => {
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
  children: ReactNode;
};

type CVStatusMessageProps = {
  cv: ClusterVersionKind;
  isFailing?: boolean;
};

type ClusterVersionConditionsLinkProps = {
  cv: ClusterVersionKind;
};
