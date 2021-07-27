import * as React from 'react';
import { GraphElement, Node } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { DetailsItem, ResourceSummary, Timestamp } from '@console/internal/components/utils';
import { CronJobModel } from '@console/internal/models';
import { CronJobKind } from '@console/internal/module/k8s';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { TYPE_WORKLOAD } from '../../const';
import { getResource } from '../../utils';

type CronJobSideBarDetailsProps = {
  cronjob: CronJobKind;
};

const CronJobSideBarDetails: React.FC<CronJobSideBarDetailsProps> = ({ cronjob }) => {
  const { t } = useTranslation();

  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      <div className="resource-overview__pod-counts">
        <PodRingSet key={cronjob.metadata.uid} obj={cronjob} path="" />
      </div>
      <ResourceSummary resource={cronjob} showPodSelector>
        <DetailsItem label={t('topology~Schedule')} obj={cronjob} path="spec.schedule" />
        <DetailsItem
          label={t('topology~Concurrency policy')}
          obj={cronjob}
          path="spec.concurrencyPolicy"
        />
        <DetailsItem
          label={t('topology~Starting deadline seconds')}
          obj={cronjob}
          path="spec.startingDeadlineSeconds"
        >
          {cronjob.spec.startingDeadlineSeconds
            ? t('topology~second', { count: cronjob.spec.startingDeadlineSeconds })
            : t('topology~Not configured')}
        </DetailsItem>
        <DetailsItem
          label={t('topology~Last schedule time')}
          obj={cronjob}
          path="status.lastScheduleTime"
        >
          <Timestamp timestamp={cronjob.status.lastScheduleTime} />
        </DetailsItem>
      </ResourceSummary>
    </div>
  );
};

export const getCronJobSideBarDetails = (element: GraphElement) => {
  if (element.getType() !== TYPE_WORKLOAD) return undefined;
  const resource = getResource<CronJobKind>(element as Node);
  if (resource.kind !== CronJobModel.kind) return undefined;
  return <CronJobSideBarDetails cronjob={resource} />;
};
