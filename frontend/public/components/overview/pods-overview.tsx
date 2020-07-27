import * as _ from 'lodash-es';
import * as React from 'react';
import { Link } from 'react-router-dom';

import { Alert, AlertActionLink } from '@patternfly/react-core';
import { Status } from '@console/shared';
import { ResourceLink, resourcePath, SidebarSectionHeading } from '../utils';
import { podPhase, PodKind, K8sResourceKind, referenceFor } from '../../module/k8s';

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

const isDeploymentGeneratedByWebConsole = (obj: K8sResourceKind) =>
  obj.kind === 'Deployment' &&
  obj.metadata?.annotations?.['openshift.io/generated-by'] === 'OpenShiftWebConsole';

const isPodWithoutImageId = (pod: PodKind) =>
  pod.status?.phase === 'Pending' &&
  pod.status?.containerStatuses?.some((containerStatus) => !containerStatus.imageID);

const podCompare = (pod1: PodKind, pod2: PodKind): number => {
  const error1 = isPodError(pod1);
  const error2 = isPodError(pod2);

  if (error1 !== error2) {
    return error1 ? 1 : 0;
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
  const phase = podPhase(pod);

  return (
    <li className="list-group-item container-fluid">
      <div className="row">
        <span className="col-xs-6">
          <ResourceLink kind={kind} name={name} namespace={namespace} />
        </span>
        <span className="col-xs-3">
          <Status status={phase} />
        </span>
        <span className="col-xs-3 text-right">
          <Link to={`${resourcePath(kind, name, namespace)}/logs`}>View logs</Link>
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

export const PodsOverview: React.SFC<PodsOverviewProps> = ({
  pods,
  obj,
  allPodsLink,
  emptyText,
}) => {
  const {
    metadata: { name, namespace },
  } = obj;

  const [showWaitingPods, setShowWaitingPods] = React.useState(false);
  const showWaitingForBuildAlert =
    isDeploymentGeneratedByWebConsole(obj) && pods.some(isPodWithoutImageId);

  let filteredPods = [...pods];
  if (showWaitingForBuildAlert && !showWaitingPods) {
    filteredPods = filteredPods.filter((pod) => !isPodWithoutImageId(pod));
  }
  filteredPods.sort(podCompare);

  const errorPodCount = _.size(_.filter(pods, (pod) => isPodError(pod)));
  const podsShown = Math.max(Math.min(errorPodCount, MAX_ERROR_PODS), MAX_PODS);
  const linkTo = allPodsLink || `${resourcePath(referenceFor(obj), name, namespace)}/pods`;
  const emptyMessage = emptyText || 'No Pods found for this resource.';

  return (
    <>
      <SidebarSectionHeading text="Pods">
        {_.size(pods) > podsShown && (
          <Link className="sidebar__section-view-all" to={linkTo}>
            {`View all (${_.size(pods)})`}
          </Link>
        )}
      </SidebarSectionHeading>
      {showWaitingForBuildAlert ? (
        <Alert
          isInline
          variant="info"
          title="Waiting for the build"
          actionLinks={
            <AlertActionLink onClick={() => setShowWaitingPods(!showWaitingPods)}>
              {`${showWaitingPods ? 'Hide' : 'Show'} waiting pods with errors`}
            </AlertActionLink>
          }
        >
          Waiting for the first build to run successfully. You may temporarily see
          "ImagePullBackOff" and "ErrImagePull" errors while waiting.
        </Alert>
      ) : null}
      {_.isEmpty(filteredPods) ? (
        <span className="text-muted">{emptyMessage}</span>
      ) : (
        <PodsOverviewList pods={_.take(filteredPods, podsShown)} />
      )}
    </>
  );
};

type PodOverviewListProps = {
  pods: PodKind[];
};

type PodsOverviewProps = {
  pods: PodKind[];
  obj: K8sResourceKind;
  allPodsLink?: string;
  emptyText?: string;
};
