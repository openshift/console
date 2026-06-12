import type { FC } from 'react';
import type { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import type { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import { DetailsItem, ResourceSummary } from '@console/internal/components/utils';
import { CronJobModel } from '@console/internal/models';
import type { CronJobKind } from '@console/internal/module/k8s';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { getResource } from '../../utils/topology-utils';

type CronJobSideBarDetailsProps = {
  cronjob: CronJobKind;
};

const CronJobSideBarDetails: FC<CronJobSideBarDetailsProps> = ({ cronjob }) => {
  const { t } = useTranslation('topology');

  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      <div className="resource-overview__pod-counts">
        <PodRingSet key={cronjob.metadata.uid} obj={cronjob} path="" />
      </div>
      <ResourceSummary resource={cronjob} showPodSelector>
        <DetailsItem label={t('Schedule')} obj={cronjob} path="spec.schedule" />
        <DetailsItem label={t('Concurrency policy')} obj={cronjob} path="spec.concurrencyPolicy" />
        <DetailsItem
          label={t('Starting deadline seconds')}
          obj={cronjob}
          path="spec.startingDeadlineSeconds"
        >
          {cronjob.spec.startingDeadlineSeconds
            ? t('second', { count: cronjob.spec.startingDeadlineSeconds })
            : t('Not configured')}
        </DetailsItem>
        <DetailsItem label={t('Last schedule time')} obj={cronjob} path="status.lastScheduleTime">
          <Timestamp timestamp={cronjob.status.lastScheduleTime} />
        </DetailsItem>
      </ResourceSummary>
    </div>
  );
};

export const useCronJobSideBarDetails: DetailsTabSectionExtensionHook = (element: GraphElement) => {
  const resource = getResource<CronJobKind>(element);
  if (!resource || resource.kind !== CronJobModel.kind) {
    return [undefined, true, undefined];
  }
  const section = <CronJobSideBarDetails cronjob={resource} />;
  return [section, true, undefined];
};
