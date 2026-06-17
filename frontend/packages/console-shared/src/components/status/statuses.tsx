import type { FC } from 'react';
import { RhUiPendingIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import type { StatusComponentProps } from '@console/dynamic-plugin-sdk';
import {
  GenericStatus,
  ErrorStatus as SdkErrorStatus,
  InfoStatus as SdkInfoStatus,
  ProgressStatus as SdkProgressStatus,
  SuccessStatus as SdkSuccessStatus,
} from '@console/dynamic-plugin-sdk';
import { YellowExclamationTriangleIcon } from './icons';

export const ErrorStatus: FC<StatusComponentProps> = ({ title, ...props }) => {
  const { t } = useTranslation('console-shared');
  return <SdkErrorStatus {...props} title={title || t('Error')} />;
};

export const InfoStatus: FC<StatusComponentProps> = ({ title, ...props }) => {
  const { t } = useTranslation('console-shared');
  return <SdkInfoStatus {...props} title={title || t('Information')} />;
};

export const ProgressStatus: FC<StatusComponentProps> = ({ title, ...props }) => {
  const { t } = useTranslation('console-shared');
  return <SdkProgressStatus {...props} title={title || t('In progress')} />;
};

export const SuccessStatus: FC<StatusComponentProps> = ({ title, ...props }) => {
  const { t } = useTranslation('console-shared');
  return <SdkSuccessStatus {...props} title={title || t('Healthy')} />;
};

const PendingStatus: FC<StatusComponentProps> = (props) => {
  const { t } = useTranslation('console-shared');
  return <GenericStatus {...props} Icon={RhUiPendingIcon} title={props.title || t('Pending')} />;
};
PendingStatus.displayName = 'PendingStatus';

export const WarningStatus: FC<StatusComponentProps> = (props) => {
  const { t } = useTranslation('console-shared');
  return (
    <GenericStatus
      {...props}
      Icon={YellowExclamationTriangleIcon}
      title={props.title || t('Warning')}
    />
  );
};
WarningStatus.displayName = 'WarningStatus';
