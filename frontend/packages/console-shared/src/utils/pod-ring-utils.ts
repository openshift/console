import * as React from 'react';
import * as _ from 'lodash';
import { DeploymentConfigModel, DeploymentModel } from '@console/internal/models';
import { ChartLabel } from '@patternfly/react-charts';
import {
  K8sResourceKind,
  K8sKind,
  SelfSubjectAccessReviewKind,
} from '@console/internal/module/k8s';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { PodRCData, PodRingResources, PodRingData, ExtPodKind } from '../types';
import { TransformResourceData } from './resource-utils';
import { checkPodEditAccess } from './pod-utils';

type PodRingLabelType = {
  subTitle: string;
  title: string;
  titleComponent: React.ReactElement;
  subTitleComponent: React.ReactElement;
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

export const podRingLabel = (
  obj: K8sResourceKind,
  canScale: boolean,
  pods: ExtPodKind[],
): PodRingLabelType => {
  const {
    spec: { replicas },
    status: { availableReplicas },
    kind,
  } = obj;

  const isPending = (pods?.length === 1 && pods[0].status?.phase === 'Pending') || replicas;
  const pluralize = replicas > 1 || replicas === 0 ? 'pods' : 'pod';
  const knativeSubtitle = canScale ? '' : 'to 0';
  const scalingSubtitle = !replicas ? knativeSubtitle : `scaling to ${replicas}`;
  const title = availableReplicas || (isPending ? '0' : canScale ? 'Scaled to 0' : 'Autoscaled');
  const subTitle = replicas !== availableReplicas ? scalingSubtitle : pluralize;
  const titleComponent =
    !availableReplicas && !isPending
      ? React.createElement(ChartLabel, { style: { fontSize: '14px' } })
      : undefined;
  const subTitleComponent =
    kind === 'Revision'
      ? React.createElement(ChartLabel, { style: { fontSize: '14px' } })
      : undefined;
  return {
    title,
    subTitle,
    titleComponent,
    subTitleComponent,
  };
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
  const deploymentKinds = {
    [DeploymentModel.kind]: 'deployments',
    [DeploymentConfigModel.kind]: 'deploymentConfigs',
  };

  const targetDeployment = deploymentKinds[kind];
  const transformResourceData = new TransformResourceData(resources);

  if (!targetDeployment) {
    throw new Error(`Invalid target deployment resource: (${targetDeployment})`);
  }
  if (_.isEmpty(resources[targetDeployment].data)) {
    return {};
  }

  const podsData: PodRingData = {};
  const resourceData = resources[targetDeployment].data;

  if (kind === DeploymentConfigModel.kind) {
    return transformResourceData
      .getPodsForDeploymentConfigs(resourceData)
      .reduce(applyPods, podsData);
  }

  if (kind === DeploymentModel.kind) {
    return transformResourceData.getPodsForDeployments(resourceData).reduce(applyPods, podsData);
  }
  return podsData;
};
