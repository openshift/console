import type { FC } from 'react';
import { DescriptionList } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { DetailsItem } from '@console/internal/components/utils';
import type { Build, BuildStatus } from '../../types';

type BuildStatusSectionProps = {
  obj: Build;
  buildStatus: BuildStatus;
};

const BuildStatusSection: FC<BuildStatusSectionProps> = ({ obj, buildStatus }) => {
  const { t } = useTranslation();

  if (!buildStatus) {
    return null;
  }

  return (
    <DescriptionList>
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
    </DescriptionList>
  );
};

export default BuildStatusSection;
