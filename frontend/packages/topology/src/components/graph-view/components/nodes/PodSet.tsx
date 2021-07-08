import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RevisionModel } from '@console/knative-plugin/src/models';
import {
  PodRCData,
  PodStatus,
  calculateRadius,
  getPodData,
  podDataInProgress,
  usePodRingLabel,
  useRelatedHPA,
} from '@console/shared';

interface PodSetProps {
  size: number;
  data: PodRCData;
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

export const podSetInnerRadius = (size: number, data: PodRCData) => {
  const { podStatusInnerRadius, podStatusStrokeWidth } = calculateRadius(size);
  let radius = podStatusInnerRadius;

  if (podDataInProgress(data.obj, data.current, data.isRollingOut)) {
    const { innerPodStatusInnerRadius } = calculateInnerPodStatusRadius(
      radius,
      podStatusStrokeWidth,
    );
    radius = innerPodStatusInnerRadius;
  }

  const { podStatusStrokeWidth: innerStrokeWidth, podStatusInset } = calculateRadius(radius * 2);

  return radius - innerStrokeWidth - podStatusInset;
};

const PodSet: React.FC<PodSetProps> = React.memo(({ size, data, x = 0, y = 0, showPodCount }) => {
  const { t } = useTranslation();
  const { podStatusOuterRadius, podStatusInnerRadius, podStatusStrokeWidth } = calculateRadius(
    size,
  );
  const { innerPodStatusOuterRadius, innerPodStatusInnerRadius } = calculateInnerPodStatusRadius(
    podStatusInnerRadius,
    podStatusStrokeWidth,
  );
  const { inProgressDeploymentData, completedDeploymentData } = getPodData(data);

  const [hpa] = useRelatedHPA(
    data.obj.apiVersion,
    data.obj.kind,
    data.obj.metadata.name,
    data.obj.metadata.namespace,
  );
  const hpaControlledScaling = !!hpa;

  const obj = data.current?.obj || data.obj;
  const ownerKind = RevisionModel.kind === data.obj?.kind ? data.obj.kind : obj.kind;
  const { title, subTitle, titleComponent } = usePodRingLabel(
    obj,
    ownerKind,
    data?.pods,
    hpaControlledScaling,
    t,
    hpa,
  );
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
        subTitle={showPodCount ? subTitle : undefined}
        title={showPodCount ? title : undefined}
        titleComponent={showPodCount ? titleComponent : undefined}
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
});

export default PodSet;
