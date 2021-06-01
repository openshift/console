import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { OverviewItem, usePluginsOverviewTabSection, usePodsWatcher } from '@console/shared';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { JobModel } from '../../models';
import { JobKind } from '../../module/k8s';
import { menuActions } from '../job';
import { DetailsItem, KebabAction, pluralize, ResourceSummary, StatusBox } from '../utils';
import { ResourceOverviewDetails } from './resource-overview-details';
import { PodsOverview } from './pods-overview';

const JobOverviewDetails: React.FC<JobOverviewDetailsProps> = ({ item }) => {
  const { obj: job } = item;
  const { namespace } = job.metadata;
  const { podData, loaded, loadError } = usePodsWatcher(job, 'Job', namespace);
  const { t } = useTranslation();
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      <div className="resource-overview__pod-counts">
        <StatusBox loaded={loaded} data={podData} loadError={loadError}>
          <PodRingSet key={job.metadata.uid} obj={job} path="" />
        </StatusBox>
      </div>
      <ResourceSummary resource={job} showPodSelector>
        <DetailsItem label={t('public~Desired completions')} obj={job} path="spec.completions" />
        <DetailsItem label={t('public~Parallelism')} obj={job} path="spec.parallelism" />
        <DetailsItem
          label={t('public~Active deadline seconds')}
          obj={job}
          path="spec.activeDeadlineSeconds"
        >
          {job.spec?.activeDeadlineSeconds
            ? pluralize(job.spec.activeDeadlineSeconds, 'second')
            : t('public~Not configured')}
        </DetailsItem>
      </ResourceSummary>
    </div>
  );
};

export const JobResourcesTab: React.SFC<JobResourcesTabProps> = ({ item }) => {
  const { obj } = item;
  const pluginComponents = usePluginsOverviewTabSection(item);
  return (
    <div className="overview__sidebar-pane-body">
      <PodsOverview obj={obj} />
      {pluginComponents.map(({ Component, key }) => (
        <Component key={key} item={item} />
      ))}
    </div>
  );
};

export const JobOverview: React.SFC<JobOverviewProps> = ({ item, customActions }) => {
  const { t } = useTranslation();
  const tabs = [
    {
      name: t('public~Details'),
      component: JobOverviewDetails,
    },
    {
      name: t('public~Resources'),
      component: JobResourcesTab,
    },
  ];
  return (
    <ResourceOverviewDetails
      item={item}
      kindObj={JobModel}
      menuActions={customActions ? [...customActions, ...menuActions] : menuActions}
      tabs={tabs}
    />
  );
};

type JobOverviewDetailsProps = {
  item: OverviewItem<JobKind>;
};

export type JobResourcesTabProps = {
  item: OverviewItem;
};

type JobOverviewProps = {
  item: OverviewItem;
  customActions?: KebabAction[];
};
