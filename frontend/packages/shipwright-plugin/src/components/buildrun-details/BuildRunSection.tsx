import type { FC } from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { ResourceLink, DetailsItem } from '@console/internal/components/utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { BuildModel, BuildModelV1Alpha1 } from '../../models';
import type { BuildRun } from '../../types';
import { getBuildNameFromBuildRun, isV1Alpha1Resource } from '../../utils';
import BuildRunDuration from '../buildrun-duration/BuildRunDuration';
import BuildRunStatus from '../buildrun-status/BuildRunStatus';

type BuildRunSectionProps = {
  buildRun: BuildRun;
};

const BuildRunSection: FC<BuildRunSectionProps> = ({ buildRun }) => {
  const { t } = useTranslation('shipwright-plugin');
  const buildModel = isV1Alpha1Resource(buildRun) ? BuildModelV1Alpha1 : BuildModel;

  return (
    <DescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
        <DescriptionListDescription>
          <BuildRunStatus buildRun={buildRun} />
        </DescriptionListDescription>
      </DescriptionListGroup>

      <DetailsItem
        label={t('Build')}
        obj={buildRun}
        path={isV1Alpha1Resource(buildRun) ? 'spec.buildRef' : 'spec.build'}
      >
        {getBuildNameFromBuildRun(buildRun) ? (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(buildModel)}
            namespace={buildRun.metadata.namespace}
            name={getBuildNameFromBuildRun(buildRun)}
          />
        ) : (
          '-'
        )}
      </DetailsItem>

      <DetailsItem label={t('Start time')} obj={buildRun} path="status.startTime">
        <Timestamp timestamp={buildRun.status?.startTime} />
      </DetailsItem>

      <DetailsItem label={t('Completion time')} obj={buildRun} path="status.completionTime">
        <Timestamp timestamp={buildRun.status?.completionTime} />
      </DetailsItem>

      <DescriptionListGroup>
        <DescriptionListTerm>{t('Duration')}</DescriptionListTerm>
        <DescriptionListDescription>
          {buildRun.status?.startTime ? <BuildRunDuration buildRun={buildRun} /> : '-'}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

export default BuildRunSection;
