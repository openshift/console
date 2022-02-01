import * as React from 'react';
import { HourglassHalfIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import {
  GenericStatus,
  StatusComponentProps,
  ErrorStatus as SdkErrorStatus,
  InfoStatus as SdkInfoStatus,
  ProgressStatus as SdkProgressStatus,
  SuccessStatus as SdkSuccessStatus,
} from '@console/dynamic-plugin-sdk';
import { YellowExclamationTriangleIcon } from './icons';

export const ErrorStatus: React.FC<StatusComponentProps> = ({ title, ...props }) => {
  const { t } = useTranslation();
  return <SdkErrorStatus {...props} title={title || t('console-shared~Error')} />;
};

export const InfoStatus: React.FC<StatusComponentProps> = ({ title, ...props }) => {
  const { t } = useTranslation();
  return <SdkInfoStatus {...props} title={title || t('console-shared~Information')} />;
};

export const ProgressStatus: React.FC<StatusComponentProps> = ({ title, ...props }) => {
  const { t } = useTranslation();
  return <SdkProgressStatus {...props} title={title || t('console-shared~In progress')} />;
};

export const SuccessStatus: React.FC<StatusComponentProps> = ({ title, ...props }) => {
  const { t } = useTranslation();
  return <SdkSuccessStatus {...props} title={title || t('console-shared~Healthy')} />;
};

export const PendingStatus: React.FC<StatusComponentProps> = (props) => {
  const { t } = useTranslation();
  return (
    <GenericStatus
      {...props}
      Icon={HourglassHalfIcon}
      title={props.title || t('console-shared~Pending')}
    />
  );
};
PendingStatus.displayName = 'PendingStatus';

export const WarningStatus: React.FC<StatusComponentProps> = (props) => {
  const { t } = useTranslation();
  return (
    <GenericStatus
      {...props}
      Icon={YellowExclamationTriangleIcon}
      title={props.title || t('console-shared~Warning')}
    />
  );
};
WarningStatus.displayName = 'WarningStatus';
