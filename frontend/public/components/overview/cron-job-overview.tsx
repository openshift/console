import * as React from 'react';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import {
  OverviewItem,
  usePluginsOverviewTabSection,
  getResourcesToWatchForPods,
  getPodsForResource,
} from '@console/shared';
import { CronJobModel } from '../../models';
import { CronJobKind, PodKind } from '../../module/k8s';
import { menuActions } from '../cron-job';
import {
  DetailsItem,
  KebabAction,
  pluralize,
  ResourceSummary,
  StatusBox,
  Timestamp,
} from '../utils';
import { ResourceOverviewDetails } from './resource-overview-details';
import { PodsOverviewMultiple } from './pods-overview';
import { BuildOverview } from './build-overview';
import { JobsOverview } from './jobs-overview';
import { useK8sWatchResources } from '../utils/k8s-watch-hook';

const CronJobOverviewDetails: React.SFC<CronJobOverviewDetailsProps> = ({
  item: { obj: cronjob, jobs },
}) => {
  const { namespace } = cronjob.metadata;
  const [jobsPods, setJobsPods] = React.useState<PodKind[]>();
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string>('');
  const watchedResources = React.useMemo(() => getResourcesToWatchForPods('CronJob', namespace), [
    namespace,
  ]);

  const resources = useK8sWatchResources(watchedResources);

  React.useEffect(() => {
    const errorKey = Object.keys(resources).find((key) => resources[key].loadError);
    if (errorKey) {
      setLoadError(resources[errorKey].loadError);
      return;
    }
    if (
      Object.keys(resources).length > 0 &&
      Object.keys(resources).every((key) => resources[key].loaded)
    ) {
      const updatedPods = jobs.reduce((acc, job) => {
        acc.push(...getPodsForResource(job, resources));
        return acc;
      }, []);
      setJobsPods(updatedPods);
      setLoaded(true);
    }
  }, [jobs, resources]);

  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      <div className="resource-overview__pod-counts">
        <StatusBox loaded={loaded} data={jobsPods} loadError={loadError}>
          <PodRingSet
            key={cronjob.metadata.uid}
            podData={{
              pods: jobsPods,
              current: undefined,
              previous: undefined,
              isRollingOut: true,
            }}
            obj={cronjob}
            resourceKind={CronJobModel}
            path=""
          />
        </StatusBox>
      </div>
      <ResourceSummary resource={cronjob} showPodSelector>
        <DetailsItem label="Schedule" obj={cronjob} path="spec.schedule" />
        <DetailsItem label="Concurrency Policy" obj={cronjob} path="spec.concurrencyPolicy" />
        <DetailsItem
          label="Starting Deadline Seconds"
          obj={cronjob}
          path="spec.startingDeadlineSeconds"
        >
          {cronjob.spec.startingDeadlineSeconds
            ? pluralize(cronjob.spec.startingDeadlineSeconds, 'second')
            : 'Not Configured'}
        </DetailsItem>
        <DetailsItem label="Last Schedule Time" obj={cronjob} path="status.lastScheduleTime">
          <Timestamp timestamp={cronjob.status.lastScheduleTime} />
        </DetailsItem>
      </ResourceSummary>
    </div>
  );
};

const CronJobResourcesTab: React.SFC<CronJobResourcesTabProps> = ({ item }) => {
  const { buildConfigs, jobs, obj } = item;
  const pluginComponents = usePluginsOverviewTabSection(item);
  return (
    <div className="overview__sidebar-pane-body">
      <PodsOverviewMultiple obj={obj} podResources={jobs} />
      <JobsOverview jobs={jobs} obj={obj} />
      <BuildOverview buildConfigs={buildConfigs} />
      {pluginComponents.map(({ Component, key }) => (
        <Component key={key} item={item} />
      ))}
    </div>
  );
};

const tabs = [
  {
    name: 'Details',
    component: CronJobOverviewDetails,
  },
  {
    name: 'Resources',
    component: CronJobResourcesTab,
  },
];

export const CronJobOverview: React.SFC<CronJobOverviewProps> = ({ item, customActions }) => (
  <ResourceOverviewDetails
    item={item}
    kindObj={CronJobModel}
    menuActions={customActions ? [...customActions, ...menuActions] : menuActions}
    tabs={tabs}
  />
);

type CronJobOverviewDetailsProps = {
  item: OverviewItem<CronJobKind>;
};

type CronJobResourcesTabProps = {
  item: OverviewItem;
};

type CronJobOverviewProps = {
  item: OverviewItem;
  customActions?: KebabAction[];
};
