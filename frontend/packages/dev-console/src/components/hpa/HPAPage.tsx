import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { ErrorPage404 } from '@console/internal/components/error';
import type { PageComponentProps } from '@console/internal/components/utils';
import { LoadingBox, LoadingInline } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { getGroupVersionKind } from '@console/internal/module/k8s';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { useRelatedHPA } from '@console/shared/src/hooks/useRelatedHPA';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import { getRequestsWarning, VALID_HPA_TARGET_KINDS } from './hpa-utils';
import HPAFormikForm from './HPAFormikForm';
import HPAPageHeader from './HPAPageHeader';

const HPAPage: FC<PageComponentProps> = () => {
  const { t } = useTranslation();
  const { ns, resourceRef, name } = useParams();
  const breakdown = getGroupVersionKind(resourceRef) || [];
  const [group, version, kind] = breakdown;
  const [hpa, hpaLoaded, hpaError] = useRelatedHPA(`${group}/${version}`, kind, name, ns);
  const resource = useMemo(
    () => ({
      kind,
      namespace: ns,
      name,
    }),
    [kind, ns, name],
  );
  const [data, workloadLoaded, workloadError] = useK8sWatchResource<K8sResourceKind>(resource);

  const fullyLoaded = hpaLoaded && workloadLoaded;
  const error = hpaError || workloadError?.message;

  const validSupportedType = VALID_HPA_TARGET_KINDS.includes(kind);
  const title = `${hpa ? t('devconsole~Edit') : t('devconsole~Add')} ${
    HorizontalPodAutoscalerModel.label
  }`;

  if (!breakdown) {
    return <ErrorPage404 />;
  }

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light} hideApplications>
      <DocumentTitle>{fullyLoaded ? title : HorizontalPodAutoscalerModel.label}</DocumentTitle>
      {fullyLoaded || error ? (
        <>
          <HPAPageHeader
            kind={kind}
            limitWarning={workloadLoaded && validSupportedType ? getRequestsWarning(data) : null}
            loadError={error}
            name={name}
            title={title}
            validSupportedType={validSupportedType}
          />
          {!error && validSupportedType && (
            <>
              {fullyLoaded ? (
                <HPAFormikForm existingHPA={hpa} targetResource={data} />
              ) : (
                <LoadingInline />
              )}
            </>
          )}
        </>
      ) : (
        <LoadingBox />
      )}
    </NamespacedPage>
  );
};

export default HPAPage;
