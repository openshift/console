import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { ResourceLink, DetailsItem, Timestamp } from '@console/internal/components/utils';
import { BuildModel } from '../../models';
import { BuildRun } from '../../types';
import BuildRunDuration from '../buildrun-duration/BuildRunDuration';
import BuildRunStatus from '../buildrun-status/BuildRunStatus';

type BuildRunSectionProps = {
  buildRun: BuildRun;
};

const BuildRunSection: React.FC<BuildRunSectionProps> = ({ buildRun }) => {
  const { t } = useTranslation();

  return (
    <dl>
      <dt>{t('shipwright-plugin~Status')}</dt>
      <dd>
        <BuildRunStatus buildRun={buildRun} />
      </dd>

      <DetailsItem label={t('shipwright-plugin~Build')} obj={buildRun} path="spec.buildRef">
        {buildRun.spec.buildRef?.name ? (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(BuildModel)}
            namespace={buildRun.metadata.namespace}
            name={buildRun.spec.buildRef.name}
          />
        ) : (
          '-'
        )}
      </DetailsItem>

      <DetailsItem label={t('shipwright-plugin~Start time')} obj={buildRun} path="status.startTime">
        <Timestamp timestamp={buildRun.status?.startTime} />
      </DetailsItem>

      <DetailsItem
        label={t('shipwright-plugin~Completion time')}
        obj={buildRun}
        path="status.completionTime"
      >
        <Timestamp timestamp={buildRun.status?.completionTime} />
      </DetailsItem>

      <>
        <dt>{t('shipwright-plugin~Duration')}</dt>
        <dd>{buildRun.status?.startTime ? <BuildRunDuration buildRun={buildRun} /> : '-'}</dd>
      </>
    </dl>
  );
};

export default BuildRunSection;
