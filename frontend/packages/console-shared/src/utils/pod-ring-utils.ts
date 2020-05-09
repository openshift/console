import * as React from 'react';
import * as _ from 'lodash';
import {
  DeploymentConfigModel,
  DeploymentModel,
  DaemonSetModel,
  StatefulSetModel,
  ReplicationControllerModel,
  ReplicaSetModel,
  PodModel,
} from '@console/internal/models';
import { ChartLabel } from '@patternfly/react-charts';
import {
  K8sResourceKind,
  K8sKind,
  SelfSubjectAccessReviewKind,
} from '@console/internal/module/k8s';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { PodRCData, PodRingResources, PodRingData, ExtPodKind } from '../types';
import { checkPodEditAccess } from './pod-utils';
import { RevisionModel } from '@console/knative-plugin';
import {
  getPodsForDeploymentConfigs,
  getPodsForDeployments,
  getPodsForStatefulSets,
  getPodsForDaemonSets,
} from './resource-utils';

import './pod-ring-text.scss';

type PodRingLabelType = {
  subTitle: string;
  title: string;
  titleComponent: React.ReactElement;
};

export const podRingFirehoseProps = {
  [PodModel.kind]: 'pods',
  [ReplicaSetModel.kind]: 'replicaSets',
  [ReplicationControllerModel.kind]: 'replicationControllers',
  [DeploymentModel.kind]: 'deployments',
  [DeploymentConfigModel.kind]: 'deploymentConfigs',
  [StatefulSetModel.kind]: 'statefulSets',
  [DaemonSetModel.kind]: 'daemonSets',
};

const applyPods = (podsData: PodRingData, dc: PodRCData) => {
  const {
    pods,
    current,
    previous,
    isRollingOut,
    obj: {
      metadata: { uid },
    },
  } = dc;
  podsData[uid] = {
    pods,
    current,
    previous,
    isRollingOut,
  };
  return podsData;
};

const pluralizeString = (count: number, singularString: string, expectedString?: string) =>
  count && count > 1 ? expectedString || `${singularString}s` : singularString;

const isPendingPods = (
  pods: ExtPodKind[],
  currentPodCount: number,
  desiredPodCount: number,
): boolean =>
  (pods?.length === 1 && pods[0].status?.phase === 'Pending') ||
  (!currentPodCount && !!desiredPodCount);
const getTitleAndSubtitle = (
  isPending: boolean,
  currentPodCount: number,
  desiredPodCount: number,
) => {
  let titlePhrase;
  let subTitlePhrase = '';
  let longSubtitle = false;

  // handles the initial state when the first pod is coming up and the state for no pods(scaled to zero)
  if (!currentPodCount) {
    titlePhrase = isPending ? '0' : `Scaled to 0`;
    if (desiredPodCount) {
      subTitlePhrase = `scaling to ${desiredPodCount}`;
      longSubtitle = true;
    }
  }

  // handles the idle state or scaling to desired no. of pods
  if (currentPodCount) {
    titlePhrase = currentPodCount.toString();
    if (currentPodCount === desiredPodCount) {
      subTitlePhrase = pluralizeString(currentPodCount, 'pod');
    } else {
      subTitlePhrase = `scaling to ${desiredPodCount}`;
      longSubtitle = true;
    }
  }

  return { title: titlePhrase, subTitle: subTitlePhrase, longSubtitle };
};

const getTitleComponent = (longSubtitle: boolean = false, reversed: boolean = false) =>
  React.createElement(ChartLabel, {
    dy: longSubtitle ? -5 : 0,
    style: { lineHeight: '11px' },
    className: `pf-chart-donut-title ${
      reversed ? 'pod-ring__center-text--reversed' : 'pod-ring__center-text'
    }`,
  });

export const podRingLabel = (
  obj: K8sResourceKind,
  ownerKind: string,
  pods: ExtPodKind[],
): PodRingLabelType => {
  let currentPodCount;
  let desiredPodCount;
  let title;
  let subTitle;
  let isPending;
  let titleData;
  switch (ownerKind) {
    case DaemonSetModel.kind:
      currentPodCount = obj.status?.currentNumberScheduled;
      desiredPodCount = obj.status?.desiredNumberScheduled;
      desiredPodCount = obj.status?.desiredNumberScheduled;
      isPending = isPendingPods(pods, currentPodCount, desiredPodCount);
      titleData = getTitleAndSubtitle(isPending, currentPodCount, desiredPodCount);
      return {
        title: titleData.title,
        subTitle: titleData.subTitle,
        titleComponent: getTitleComponent(titleData.longSubtitle),
      };
    case RevisionModel.kind:
      currentPodCount = obj.status?.readyReplicas;
      desiredPodCount = obj.spec?.replicas;
      isPending = isPendingPods(pods, currentPodCount, desiredPodCount);
      if (!isPending && !desiredPodCount) {
        title = 'Autoscaled';
        subTitle = 'to 0';
        return {
          title,
          subTitle,
          titleComponent: getTitleComponent(false, true),
        };
      }
      if (isPending) {
        title = '0';
        subTitle = `scaling to ${desiredPodCount}`;
      } else {
        title = currentPodCount;
        subTitle = pluralizeString(currentPodCount, 'pod');
      }
      return {
        title,
        subTitle,
        titleComponent: getTitleComponent(),
      };
    default:
      currentPodCount = obj.status?.readyReplicas;
      desiredPodCount = obj.spec?.replicas;
      isPending = isPendingPods(pods, currentPodCount, desiredPodCount);
      titleData = getTitleAndSubtitle(isPending, currentPodCount, desiredPodCount);
      return {
        title: titleData.title,
        subTitle: titleData.subTitle,
        titleComponent: getTitleComponent(titleData.longSubtitle),
      };
  }
};

export const usePodScalingAccessStatus = (
  obj: K8sResourceKind,
  resourceKind: K8sKind,
  pods: ExtPodKind[],
  enableScaling?: boolean,
  impersonate?: string,
) => {
  const [editable, setEditable] = useSafetyFirst(false);
  React.useEffect(() => {
    checkPodEditAccess(obj, resourceKind, impersonate)
      .then((resp: SelfSubjectAccessReviewKind) =>
        setEditable(_.get(resp, 'status.allowed', false)),
      )
      .catch((error) => {
        // console.log is used here instead of throw error
        // throw error will break the thread and likely end-up in a white screen
        // eslint-disable-next-line
        console.log(error);
        setEditable(false);
      });
  }, [pods, obj, resourceKind, impersonate, setEditable]);

  const isKnativeRevision = obj.kind === 'Revision';
  const isScalingAllowed = !isKnativeRevision && editable && enableScaling;
  return isScalingAllowed;
};

export const transformPodRingData = (resources: PodRingResources, kind: string): PodRingData => {
  const targetResource = podRingFirehoseProps[kind];

  if (!targetResource) {
    throw new Error(`Invalid target resource: (${targetResource})`);
  }
  if (_.isEmpty(resources[targetResource].data)) {
    return {};
  }

  const podsData: PodRingData = {};
  const resourceData = resources[targetResource].data;

  if (kind === DeploymentConfigModel.kind) {
    return getPodsForDeploymentConfigs(resourceData, resources).reduce(applyPods, podsData);
  }

  if (kind === DeploymentModel.kind) {
    return getPodsForDeployments(resourceData, resources).reduce(applyPods, podsData);
  }

  if (kind === StatefulSetModel.kind) {
    return getPodsForStatefulSets(resourceData, resources).reduce(applyPods, podsData);
  }

  if (kind === DaemonSetModel.kind) {
    return getPodsForDaemonSets(resourceData, resources).reduce(applyPods, podsData);
  }

  return podsData;
};
