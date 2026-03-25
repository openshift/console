import type { FC } from 'react';
import { HourglassHalfIcon } from '@patternfly/react-icons/dist/esm/icons/hourglass-half-icon';
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
  const { t } = useTranslation();
  return <SdkErrorStatus {...props} title={title || t('console-shared~Error')} />;
};

export const InfoStatus: FC<StatusComponentProps> = ({ title, ...props }) => {
  const { t } = useTranslation();
  return <SdkInfoStatus {...props} title={title || t('console-shared~Information')} />;
};

export const ProgressStatus: FC<StatusComponentProps> = ({ title, ...props }) => {
  const { t } = useTranslation();
  return <SdkProgressStatus {...props} title={title || t('console-shared~In progress')} />;
};

export const SuccessStatus: FC<StatusComponentProps> = ({ title, ...props }) => {
  const { t } = useTranslation();
  return <SdkSuccessStatus {...props} title={title || t('console-shared~Healthy')} />;
};

export const PendingStatus: FC<StatusComponentProps> = (props) => {
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

export const WarningStatus: FC<StatusComponentProps> = (props) => {
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
