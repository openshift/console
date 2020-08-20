import * as React from 'react';
import {
  PodStatus,
  calculateRadius,
  getPodData,
  podRingLabel,
  podDataInProgress,
  hpaPodRingLabel,
} from '@console/shared';
import { RevisionModel } from '@console/knative-plugin/src/models';
import { DonutStatusData } from '../../topology-types';
import { useRelatedHPA } from '../../../hpa/hooks';

interface PodSetProps {
  size: number;
  data: DonutStatusData;
  showPodCount?: boolean;
  x?: number;
  y?: number;
}

interface InnerPodStatusRadius {
  innerPodStatusOuterRadius: number;
  innerPodStatusInnerRadius: number;
}

const calculateInnerPodStatusRadius = (
  outerPodStatusInnerRadius: number,
  outerPodStatusWidth: number,
): InnerPodStatusRadius => {
  const innerPodStatusWidth = outerPodStatusWidth * 0.6;
  const spaceBwOuterAndInnerPodStatus = 3;
  const innerPodStatusOuterRadius = outerPodStatusInnerRadius - spaceBwOuterAndInnerPodStatus;
  const innerPodStatusInnerRadius = innerPodStatusOuterRadius - innerPodStatusWidth;

  return { innerPodStatusOuterRadius, innerPodStatusInnerRadius };
};

export const podSetInnerRadius = (size: number, data: DonutStatusData) => {
  const { podStatusInnerRadius, podStatusStrokeWidth } = calculateRadius(size);
  let radius = podStatusInnerRadius;

  if (podDataInProgress(data.dc, data.current, data.isRollingOut)) {
    const { innerPodStatusInnerRadius } = calculateInnerPodStatusRadius(
      radius,
      podStatusStrokeWidth,
    );
    radius = innerPodStatusInnerRadius;
  }

  const { podStatusStrokeWidth: innerStrokeWidth, podStatusInset } = calculateRadius(radius * 2);

  return radius - innerStrokeWidth - podStatusInset;
};

const PodSet: React.FC<PodSetProps> = ({ size, data, x = 0, y = 0, showPodCount }) => {
  const { podStatusOuterRadius, podStatusInnerRadius, podStatusStrokeWidth } = calculateRadius(
    size,
  );
  const { innerPodStatusOuterRadius, innerPodStatusInnerRadius } = calculateInnerPodStatusRadius(
    podStatusInnerRadius,
    podStatusStrokeWidth,
  );
  const { inProgressDeploymentData, completedDeploymentData } = getPodData(
    data.dc,
    data.pods,
    data.current,
    data.previous,
    data.isRollingOut,
  );

  const [hpa] = useRelatedHPA(
    data.dc.apiVersion,
    data.dc.kind,
    data.dc.metadata.name,
    data.dc.metadata.namespace,
  );
  const hpaControlledScaling = !!hpa;

  const obj = data.current?.obj || data.dc;
  const ownerKind = RevisionModel.kind === data.dc?.kind ? data.dc.kind : obj.kind;
  const { title, subTitle, titleComponent } = hpaControlledScaling
    ? hpaPodRingLabel(obj, hpa, data?.pods)
    : podRingLabel(obj, ownerKind, data?.pods);
  return (
    <>
      <PodStatus
        key={inProgressDeploymentData ? 'deploy' : 'notDeploy'}
        x={x - size / 2}
        y={y - size / 2}
        innerRadius={podStatusInnerRadius}
        outerRadius={podStatusOuterRadius}
        data={completedDeploymentData}
        size={size}
        subTitle={showPodCount && subTitle}
        title={showPodCount && title}
        titleComponent={showPodCount && titleComponent}
      />
      {inProgressDeploymentData && (
        <PodStatus
          x={x - size / 2}
          y={y - size / 2}
          innerRadius={innerPodStatusInnerRadius}
          outerRadius={innerPodStatusOuterRadius}
          data={inProgressDeploymentData}
          size={size}
        />
      )}
    </>
  );
};

export default PodSet;
