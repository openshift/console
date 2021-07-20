import * as _ from 'lodash-es';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Alert, AlertActionLink } from '@patternfly/react-core';
import {
  usePodsWatcher,
  getPodsForResource,
  getResourcesToWatchForPods,
  BuildConfigData,
} from '@console/shared';
import { ResourceLink, resourcePath, SidebarSectionHeading, LoadingBox } from '../utils';
import { podPhase, PodKind, K8sResourceKind, referenceFor } from '../../module/k8s';
import { useK8sWatchResources } from '../utils/k8s-watch-hook';
import { PodStatus } from '../pod';

const kind: string = 'Pod';
const MAX_PODS: number = 3;
const MAX_ERROR_PODS: number = 10;

const podUpdateTime = (pod: PodKind) => {
  const allStatuses = [
    ..._.get(pod, 'status.containerStatuses', []),
    ..._.get(pod, 'status.initContainerStatuses', []),
  ];
  const updateTimes = _.reduce(
    allStatuses,
    (times, nextStatus) => {
      if (nextStatus.state.running) {
        return [...times, _.get(nextStatus, 'state.running.startedAt')];
      }
      if (nextStatus.state.terminated) {
        return [...times, _.get(nextStatus, 'state.terminated.finishedAt')];
      }
      if (nextStatus.lastState.running) {
        return [...times, _.get(nextStatus, 'lastState.running.startedAt')];
      }
      if (nextStatus.lastState.terminated) {
        return [...times, _.get(nextStatus, 'lastState.terminated.finishedAt')];
      }
      return [...times, _.get(nextStatus, _.get(pod, 'startTime'))];
    },
    [],
  );

  return _.head(_.reverse(updateTimes.sort()));
};

const errorPhases = [
  'ContainerCannotRun',
  'CrashLoopBackOff',
  'Critical',
  'Error',
  'Failed',
  'InstallCheckFailed',
  'Cancelled',
  'Expired',
  'Not Ready',
  'Terminating',
];

const isPodError = (pod: PodKind) => _.includes(errorPhases, podPhase(pod));

const isEvicted = (pod: PodKind) => podPhase(pod) === 'Evicted';

const isDeploymentGeneratedByWebConsole = (obj: K8sResourceKind) =>
  obj.kind === 'Deployment' &&
  obj.metadata?.annotations?.['openshift.io/generated-by'] === 'OpenShiftWebConsole';

const isPodWithoutImageId = (pod: PodKind) =>
  pod.status?.phase === 'Pending' &&
  pod.status?.containerStatuses?.some((containerStatus) => !containerStatus.imageID);

export const podCompare = (pod1: PodKind, pod2: PodKind): number => {
  const error1 = isPodError(pod1);
  const error2 = isPodError(pod2);

  if (error1 !== error2) {
    return error1 ? -1 : 1;
  }

  const evicted1 = isEvicted(pod1);
  const evicted2 = isEvicted(pod2);

  if (evicted1 !== evicted2) {
    return evicted1 ? 1 : -1;
  }

  const runtime1 = podUpdateTime(pod1);
  const runtime2 = podUpdateTime(pod2);

  if (runtime1 < runtime2) {
    return 1;
  }
  if (runtime1 > runtime2) {
    return -1;
  }

  return pod1.metadata.name.localeCompare(pod2.metadata.name);
};

const PodOverviewItem: React.FC<PodOverviewItemProps> = ({ pod }) => {
  const {
    metadata: { name, namespace },
  } = pod;
  const { t } = useTranslation();
  return (
    <li className="list-group-item container-fluid">
      <div className="row">
        <span className="col-xs-6">
          <ResourceLink kind={kind} name={name} namespace={namespace} />
        </span>
        <span className="col-xs-3">
          <PodStatus pod={pod} />
        </span>
        <span className="col-xs-3 pf-u-text-align-right">
          <Link to={`${resourcePath(kind, name, namespace)}/logs`}>{t('public~View logs')}</Link>
        </span>
      </div>
    </li>
  );
};

PodOverviewItem.displayName = 'PodOverviewItem';

type PodOverviewItemProps = {
  pod: PodKind;
};

const PodsOverviewList: React.SFC<PodOverviewListProps> = ({ pods }) => (
  <ul className="list-group">
    {_.map(pods, (pod) => (
      <PodOverviewItem key={pod.metadata.uid} pod={pod} />
    ))}
  </ul>
);

PodsOverviewList.displayName = 'PodsOverviewList';

const isComplete = (build: K8sResourceKind) => build.status?.completionTimestamp;

export const PodsOverviewContent: React.SFC<PodsOverviewContentProps> = ({
  obj,
  pods,
  loaded,
  loadError,
  allPodsLink,
  emptyText,
  buildConfigData,
}) => {
  const {
    metadata: { name, namespace },
  } = obj;
  const { t } = useTranslation();
  const [showWaitingPods, setShowWaitingPods] = React.useState(false);
  const showWaitingForBuildAlert =
    buildConfigData?.buildConfigs?.length > 0 &&
    !buildConfigData.buildConfigs[0].builds.some((build) => isComplete(build)) &&
    isDeploymentGeneratedByWebConsole(obj);

  let filteredPods = [...pods];
  if (showWaitingForBuildAlert && !showWaitingPods) {
    filteredPods = filteredPods.filter((pod) => !isPodWithoutImageId(pod));
  }
  filteredPods.sort(podCompare);

  const errorPodCount = _.size(_.filter(pods, (pod) => isPodError(pod)));
  const podsShown = Math.max(Math.min(errorPodCount, MAX_ERROR_PODS), MAX_PODS);
  const linkTo = allPodsLink || `${resourcePath(referenceFor(obj), name, namespace)}/pods`;
  const emptyMessage = emptyText || t('public~No Pods found for this resource.');

  const podAlert = showWaitingForBuildAlert ? (
    <Alert
      isInline
      variant="info"
      title={t('public~Waiting for the build')}
      actionLinks={
        <AlertActionLink onClick={() => setShowWaitingPods(!showWaitingPods)}>
          {showWaitingPods
            ? t('public~Hide waiting pods with errors')
            : t('public~Show waiting pods with errors')}
        </AlertActionLink>
      }
    >
      {t(
        'public~Waiting for the first build to run successfully. You may temporarily see "ImagePullBackOff" and "ErrImagePull" errors while waiting.',
      )}
    </Alert>
  ) : null;

  return (
    <>
      <SidebarSectionHeading text={t('public~Pods')}>
        {_.size(pods) > podsShown && (
          <Link className="sidebar__section-view-all" to={linkTo}>
            {t('public~View all {{podSize}}', { podSize: _.size(pods) })}
          </Link>
        )}
      </SidebarSectionHeading>
      {buildConfigData?.loaded && !buildConfigData?.loadError && podAlert}
      {_.isEmpty(filteredPods) ? (
        <span className="text-muted">{loaded || !!loadError ? emptyMessage : <LoadingBox />}</span>
      ) : (
        <PodsOverviewList pods={_.take(filteredPods, podsShown)} />
      )}
    </>
  );
};
PodsOverviewContent.displayName = 'PodsOverviewContent';

export const PodsOverview: React.SFC<PodsOverviewProps> = ({
  obj,
  podsFilter,
  hideIfEmpty = false,
  ...props
}) => {
  const {
    metadata: { namespace },
  } = obj;
  const [pods, setPods] = React.useState<PodKind[]>([]);
  const { podData, loadError, loaded } = usePodsWatcher(obj, obj.kind, namespace);

  React.useEffect(() => {
    if (!loadError && loaded) {
      let updatedPods = podData.pods as PodKind[];
      if (podsFilter) {
        updatedPods = updatedPods.filter(podsFilter);
      }
      setPods(updatedPods);
    }
  }, [podData, loadError, loaded, podsFilter]);

  if (!pods.length && hideIfEmpty) {
    return null;
  }

  return (
    <PodsOverviewContent obj={obj} pods={pods} loaded={loaded} loadError={loadError} {...props} />
  );
};

export const PodsOverviewMultiple: React.SFC<PodsOverviewMultipleProps> = ({
  obj,
  podResources,
  podsFilter,
  ...props
}) => {
  const {
    metadata: { namespace },
  } = obj;

  const [pods, setPods] = React.useState<PodKind[]>([]);
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
    setLoadError('');
    if (
      Object.keys(resources).length > 0 &&
      Object.keys(resources).every((key) => resources[key].loaded)
    ) {
      let updatedPods = podResources?.length
        ? podResources.reduce((acc, resource) => {
            acc.push(...getPodsForResource(resource, resources));
            return acc;
          }, [])
        : [];
      if (podsFilter) {
        updatedPods = updatedPods.filter(podsFilter);
      }
      setPods(updatedPods);
      setLoaded(true);
    }
  }, [podResources, podsFilter, resources]);

  return (
    <PodsOverviewContent obj={obj} pods={pods} loaded={loaded} loadError={loadError} {...props} />
  );
};

type PodOverviewListProps = {
  pods: PodKind[];
};

type PodsOverviewContentProps = {
  obj: K8sResourceKind;
  pods: PodKind[];
  loaded: boolean;
  loadError: string;
  allPodsLink?: string;
  emptyText?: string;
  buildConfigData?: BuildConfigData;
  podsFilter?: (pod: PodKind) => boolean;
};

type PodsOverviewProps = {
  obj: K8sResourceKind;
  allPodsLink?: string;
  emptyText?: string;
  buildConfigData?: BuildConfigData;
  podsFilter?: (pod: PodKind) => boolean;
  hideIfEmpty?: boolean;
};

type PodsOverviewMultipleProps = {
  obj: K8sResourceKind;
  podResources: K8sResourceKind[];
  allPodsLink?: string;
  emptyText?: string;
  buildConfigData?: BuildConfigData;
  podsFilter?: (pod: PodKind) => boolean;
};
