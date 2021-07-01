import * as React from 'react';
import { HourglassHalfIcon, InProgressIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import GenericStatus from './GenericStatus';
import {
  RedExclamationCircleIcon,
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
  BlueInfoCircleIcon,
} from './icons';
import { StatusComponentProps } from './types';

export const ErrorStatus: React.FC<StatusComponentProps> = (props) => {
  const { t } = useTranslation();
  return (
    <GenericStatus
      {...props}
      Icon={RedExclamationCircleIcon}
      title={props.title || t('dynamic-plugin-sdk~Error')}
    />
  );
};
ErrorStatus.displayName = 'ErrorStatus';

export const InfoStatus: React.FC<StatusComponentProps> = (props) => {
  const { t } = useTranslation();
  return (
    <GenericStatus
      {...props}
      Icon={BlueInfoCircleIcon}
      title={props.title || t('dynamic-plugin-sdk~Information')}
    />
  );
};
InfoStatus.displayName = 'InfoStatus';

export const PendingStatus: React.FC<StatusComponentProps> = (props) => {
  const { t } = useTranslation();
  return (
    <GenericStatus
      {...props}
      Icon={HourglassHalfIcon}
      title={props.title || t('dynamic-plugin-sdk~Pending')}
    />
  );
};
PendingStatus.displayName = 'PendingStatus';

export const ProgressStatus: React.FC<StatusComponentProps> = (props) => {
  const { t } = useTranslation();
  return (
    <GenericStatus
      {...props}
      Icon={InProgressIcon}
      title={props.title || t('dynamic-plugin-sdk~In progress')}
    />
  );
};
ProgressStatus.displayName = 'ProgressStatus';

export const SuccessStatus: React.FC<StatusComponentProps> = (props) => {
  const { t } = useTranslation();
  return (
    <GenericStatus
      {...props}
      Icon={GreenCheckCircleIcon}
      title={props.title || t('dynamic-plugin-sdk~Healthy')}
    />
  );
};
SuccessStatus.displayName = 'SuccessStatus';

export const WarningStatus: React.FC<StatusComponentProps> = (props) => {
  const { t } = useTranslation();
  return (
    <GenericStatus
      {...props}
      Icon={YellowExclamationTriangleIcon}
      title={props.title || t('dynamic-plugin-sdk~Warning')}
    />
  );
};
WarningStatus.displayName = 'WarningStatus';
