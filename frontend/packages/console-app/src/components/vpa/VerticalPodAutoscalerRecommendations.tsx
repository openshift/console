import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getGroupVersionKindForResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { K8sResourceCommon } from '@console/internal/module/k8s';
import { getVerticalPodAutoscalerForResource } from '@console/shared/src';

export const VerticalPodAutoscalerRecommendations: React.FC<VerticalPodAutoscalerRecommendationsProps> = ({
  obj,
}) => {
  const { t } = useTranslation();
  const [vpas] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: {
      group: 'autoscaling.k8s.io',
      version: 'v1',
      kind: 'VerticalPodAutoscaler',
    },
    namespace: obj?.metadata?.namespace,
    isList: true,
    namespaced: true,
  });

  const verticalPodAutoscaler = getVerticalPodAutoscalerForResource(vpas, obj);
  const recommendations =
    verticalPodAutoscaler?.status?.recommendation?.containerRecommendations ?? [];

  return (
    <>
      <dt>{t('console-app~VerticalPodAutoscaler')}</dt>
      <dd>
        {verticalPodAutoscaler ? (
          <>
            <p>
              <ResourceLink
                groupVersionKind={getGroupVersionKindForResource(verticalPodAutoscaler)}
                name={verticalPodAutoscaler?.metadata?.name}
                namespace={verticalPodAutoscaler?.metadata?.namespace}
              />
            </p>
            {recommendations.length > 0 && <p>{t('console-app~Recommended')}</p>}
            {recommendations.map((recommendation) => (
              <React.Fragment key={recommendation.containerName}>
                <div>
                  {t('console-app~Container name')}: {recommendation.containerName}
                </div>
                <div>
                  {t('console-app~CPU')}: {recommendation.target.cpu}
                </div>
                <div>
                  {t('console-app~Memory')}: {recommendation.target.memory}
                </div>
              </React.Fragment>
            ))}
          </>
        ) : (
          t('console-app~No VerticalPodAutoscaler')
        )}
      </dd>
    </>
  );
};

type VerticalPodAutoscalerRecommendationsProps = {
  obj: K8sResourceCommon;
};
