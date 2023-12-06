import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getGroupVersionKindForResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getVerticalPodAutoscalersForResource } from '@console/shared/src';

const Recommendations: React.FC<VerticalPodAutoscalerRecommendationsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const recommendations = obj?.status?.recommendation?.containerRecommendations ?? [];
  return (
    <>
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
  );
};

export const VerticalPodAutoscalerRecommendations: React.FC<VerticalPodAutoscalerRecommendationsProps> = ({
  obj,
}) => {
  const { t } = useTranslation();
  const [vpas] = useK8sWatchResource<K8sResourceKind[]>({
    groupVersionKind: {
      group: 'autoscaling.k8s.io',
      version: 'v1',
      kind: 'VerticalPodAutoscaler',
    },
    namespace: obj?.metadata?.namespace,
    isList: true,
    namespaced: true,
  });

  const verticalPodAutoscalers = getVerticalPodAutoscalersForResource(vpas, obj);

  return (
    <>
      <dt>{t('console-app~VerticalPodAutoscalers')}</dt>
      <dd>
        {verticalPodAutoscalers.length > 0
          ? verticalPodAutoscalers.map((vpa) => (
              <>
                <p>
                  <ResourceLink
                    groupVersionKind={getGroupVersionKindForResource(vpa)}
                    name={vpa?.metadata?.name}
                    namespace={vpa?.metadata?.namespace}
                  />
                </p>
                <Recommendations obj={vpa} />
              </>
            ))
          : t('console-app~No VerticalPodAutoscalers')}
      </dd>
    </>
  );
};

type VerticalPodAutoscalerRecommendationsProps = {
  obj: K8sResourceKind;
};
