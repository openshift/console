import * as React from 'react';
import { ChartLabel } from '@patternfly/react-charts';
import * as classNames from 'classnames';
import i18next, { TFunction } from 'i18next';
import * as _ from 'lodash';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { DaemonSetModel, PodModel, JobModel, CronJobModel } from '@console/internal/models';
import {
  K8sResourceKind,
  K8sKind,
  SelfSubjectAccessReviewKind,
  HorizontalPodAutoscalerKind,
} from '@console/internal/module/k8s';
import { RevisionModel } from '@console/knative-plugin';
import { AllPodStatus } from '../constants';
import { ExtPodKind } from '../types';
import { checkPodEditAccess, getPodStatus } from './pod-utils';

import './pod-ring-text.scss';

type PodRingLabelType = {
  subTitle: string;
  title: string;
  titleComponent: React.ReactElement;
};

type PodRingLabelData = {
  title: string;
  longTitle: boolean;
  subTitle: string;
  longSubtitle: boolean;
  reversed: boolean;
};

const podKindString = (count: number) =>
  count === 1 ? i18next.t('console-shared~Pod') : i18next.t('console-shared~Pods');

const isPendingPods = (
  pods: ExtPodKind[],
  currentPodCount: number,
  desiredPodCount: number,
): boolean =>
  (pods?.length === 1 && pods[0].status?.phase === 'Pending') ||
  (!currentPodCount && !!desiredPodCount);

export const getFailedPods = (pods: ExtPodKind[]): number => {
  if (!pods?.length) {
    return 0;
  }

  return pods.reduce((acc, currValue) => {
    if ([AllPodStatus.CrashLoopBackOff, AllPodStatus.Failed].includes(getPodStatus(currValue))) {
      return acc + 1;
    }
    return acc;
  }, 0);
};

const getTitleAndSubtitle = (
  isPending: boolean,
  currentPodCount: number,
  desiredPodCount: number,
  t: TFunction,
) => {
  let titlePhrase;
  let subTitlePhrase = '';
  let longTitle = false;
  let longSubtitle = false;

  // handles the initial state when the first pod is coming up and the state for no pods(scaled to zero)
  if (!currentPodCount) {
    titlePhrase = isPending ? '0' : t('console-shared~Scaled to 0');
    longTitle = !isPending;
    if (desiredPodCount) {
      subTitlePhrase = t('console-shared~Scaling to {{podSubTitle}}', {
        podSubTitle: desiredPodCount,
      });
      longSubtitle = true;
    }
  }

  // handles the idle state or scaling to desired no. of pods
  if (currentPodCount) {
    titlePhrase = currentPodCount.toString();
    if (currentPodCount === desiredPodCount) {
      subTitlePhrase = podKindString(currentPodCount);
    } else {
      subTitlePhrase = t('console-shared~Scaling to {{podSubTitle}}', {
        podSubTitle: desiredPodCount,
      });
      longSubtitle = true;
    }
  }

  return { title: titlePhrase, longTitle, subTitle: subTitlePhrase, longSubtitle };
};

const getTitleComponent = (
  longTitle: boolean = false,
  longSubtitle: boolean = false,
  reversed: boolean = false,
) => {
  const labelClasses = classNames('pf-chart-donut-title', {
    'pod-ring__center-text--reversed': reversed,
    'pod-ring__center-text': !reversed,
    'pod-ring__long-text': longTitle,
  });
  return React.createElement(ChartLabel, {
    dy: longSubtitle ? -5 : 0,
    style: { lineHeight: '11px' },
    className: labelClasses,
  });
};

export const podRingLabel = (
  obj: K8sResourceKind,
  ownerKind: string,
  pods: ExtPodKind[],
  t: TFunction,
): PodRingLabelData => {
  let currentPodCount;
  let desiredPodCount;
  let isPending;
  let titleData;
  const podRingLabelData: PodRingLabelData = {
    title: '',
    subTitle: '',
    longTitle: false,
    longSubtitle: false,
    reversed: false,
  };

  const failedPodCount = getFailedPods(pods);
  switch (ownerKind) {
    case DaemonSetModel.kind:
      currentPodCount = (obj.status?.currentNumberScheduled || 0) + failedPodCount;
      desiredPodCount = obj.status?.desiredNumberScheduled;
      desiredPodCount = obj.status?.desiredNumberScheduled;
      isPending = isPendingPods(pods, currentPodCount, desiredPodCount);
      titleData = getTitleAndSubtitle(isPending, currentPodCount, desiredPodCount, t);
      podRingLabelData.title = titleData.title;
      podRingLabelData.subTitle = titleData.subTitle;
      podRingLabelData.longSubtitle = titleData.longSubtitle;
      break;
    case RevisionModel.kind:
      currentPodCount = (obj.status?.readyReplicas || 0) + failedPodCount;
      desiredPodCount = obj.spec?.replicas;
      isPending = isPendingPods(pods, currentPodCount, desiredPodCount);
      if (!isPending && !desiredPodCount) {
        podRingLabelData.title = t('console-shared~Autoscaled');
        podRingLabelData.subTitle = t('console-shared~to 0');
        podRingLabelData.reversed = true;
        break;
      }
      if (isPending) {
        podRingLabelData.title = '0';
        podRingLabelData.subTitle = t('console-shared~Scaling to {{podSubTitle}}', {
          podSubTitle: desiredPodCount,
        });
      } else {
        podRingLabelData.title = currentPodCount;
        podRingLabelData.subTitle = podKindString(currentPodCount);
      }
      break;
    case PodModel.kind:
    case JobModel.kind:
      podRingLabelData.title = '1';
      podRingLabelData.subTitle = PodModel.label;
      break;
    case CronJobModel.kind:
      podRingLabelData.title = `${pods.length}`;
      podRingLabelData.subTitle = podKindString(currentPodCount);
      break;
    default:
      currentPodCount = (obj.status?.readyReplicas || 0) + failedPodCount;
      desiredPodCount = obj.spec?.replicas;
      isPending = isPendingPods(pods, currentPodCount, desiredPodCount);
      titleData = getTitleAndSubtitle(isPending, currentPodCount, desiredPodCount, t);
      podRingLabelData.title = titleData.title;
      podRingLabelData.subTitle = titleData.subTitle;
      podRingLabelData.longTitle = titleData.longTitle;
      podRingLabelData.longSubtitle = titleData.longSubtitle;
      break;
  }

  return podRingLabelData;
};

export const hpaPodRingLabel = (
  obj: K8sResourceKind,
  hpa: HorizontalPodAutoscalerKind,
  pods: ExtPodKind[],
  t: TFunction,
): PodRingLabelData => {
  const desiredPodCount = obj.spec?.replicas;
  const desiredPods = hpa.status?.desiredReplicas || desiredPodCount;
  const currentPods = hpa.status?.currentReplicas;
  const scaling =
    (!currentPods && !!desiredPods) || !pods.every((p) => p.status?.phase === 'Running');
  return {
    title: scaling ? t('console-shared~Autoscaling') : t('console-shared~Autoscaled'),
    subTitle: t('console-shared~to {{count}} Pod', { count: desiredPods }),
    longTitle: false,
    longSubtitle: false,
    reversed: true,
  };
};

export const usePodRingLabel = (
  obj: K8sResourceKind,
  ownerKind: string,
  pods: ExtPodKind[],
  hpaControlledScaling: boolean = false,
  t: TFunction,
  hpa?: HorizontalPodAutoscalerKind,
): PodRingLabelType => {
  const podRingLabelData = hpaControlledScaling
    ? hpaPodRingLabel(obj, hpa, pods, t)
    : podRingLabel(obj, ownerKind, pods, t);
  const { title, subTitle, longTitle, longSubtitle, reversed } = podRingLabelData;

  return React.useMemo(
    () => ({
      title,
      subTitle,
      titleComponent: getTitleComponent(longTitle, longSubtitle, reversed),
    }),
    [longSubtitle, longTitle, reversed, subTitle, title],
  );
};

export const usePodScalingAccessStatus = (
  obj: K8sResourceKind,
  resourceKind: K8sKind,
  pods: ExtPodKind[],
  enableScaling?: boolean,
  impersonate?: string,
) => {
  const isKnativeRevision = obj.kind === 'Revision';
  const isPod = obj.kind === 'Pod';
  const isScalingAllowed = !isKnativeRevision && !isPod && enableScaling;
  const [editable, setEditable] = useSafetyFirst(false);

  React.useEffect(() => {
    if (isScalingAllowed) {
      checkPodEditAccess(obj, resourceKind, impersonate, 'scale')
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
    }
  }, [pods, obj, resourceKind, impersonate, setEditable, isScalingAllowed]);

  return editable;
};
