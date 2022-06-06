import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailsItem } from '@console/internal/components/utils';
import { Build, BuildStatus } from '../../types';

type BuildStatusSectionProps = {
  obj: Build;
  buildStatus: BuildStatus;
};

const BuildStatusSection: React.FC<BuildStatusSectionProps> = ({ obj, buildStatus }) => {
  const { t } = useTranslation();

  if (!buildStatus) {
    return null;
  }

  return (
    <dl>
      {buildStatus.registered ? (
        <DetailsItem label={t('shipwright-plugin~Registered')} obj={obj} path="status.registered">
          {buildStatus.registered}
        </DetailsItem>
      ) : null}
      {buildStatus.reason ? (
        <DetailsItem label={t('shipwright-plugin~Reason')} obj={obj} path="status.reason">
          {buildStatus.reason}
        </DetailsItem>
      ) : null}
      {buildStatus.message ? (
        <DetailsItem label={t('shipwright-plugin~Message')} obj={obj} path="status.message">
          {buildStatus.message}
        </DetailsItem>
      ) : null}
    </dl>
  );
};

export default BuildStatusSection;
