import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceCommon } from '@console/internal/module/k8s';

export const filterVerticalPodAutoscaler = (vpas, obj) =>
  (vpas ?? []).find((vpa) => {
    const { targetRef } = vpa.spec;
    return (
      targetRef &&
      targetRef.apiVersion === obj?.apiVersion &&
      targetRef.kind === obj?.kind &&
      targetRef.name === obj?.metadata?.name
    );
  });

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

  const verticalPodAutoscaler = filterVerticalPodAutoscaler(vpas, obj);

  const targetCPU =
    verticalPodAutoscaler?.status?.recommendation?.containerRecommendations?.[0]?.target?.cpu;
  const targetMemory =
    verticalPodAutoscaler?.status?.recommendation?.containerRecommendations?.[0]?.target?.memory;

  return (
    <>
      <dt>{t('console-app~VerticalPodAutoscaler')}</dt>
      <dd>
        {targetCPU || targetMemory ? (
          <>
            <p>Recommended</p>
            {targetCPU && (
              <>
                <div>
                  {t('console-app~CPU')}: {targetCPU}
                </div>
              </>
            )}
            {targetMemory && (
              <>
                <div>
                  {t('console-app~Memory')}: {targetMemory}
                </div>
              </>
            )}
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
