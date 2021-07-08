import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { ErrorPage404 } from '@console/internal/components/error';
import { LoadingBox, LoadingInline, PageComponentProps } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import { getGroupVersionKind, K8sResourceKind } from '@console/internal/module/k8s';
import { useRelatedHPA } from '@console/shared';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import { getLimitWarning, VALID_HPA_TARGET_KINDS } from './hpa-utils';
import HPAFormikForm from './HPAFormikForm';
import HPAPageHeader from './HPAPageHeader';

const HPAPage: React.FC<PageComponentProps> = (props) => {
  const { t } = useTranslation();
  const {
    match: {
      params: { ns, resourceRef, name },
    },
  } = props;
  const breakdown = getGroupVersionKind(resourceRef) || [];
  const [group, version, kind] = breakdown;
  const [hpa, hpaLoaded, hpaError] = useRelatedHPA(`${group}/${version}`, kind, name, ns);
  const resource = React.useMemo(
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
      <Helmet>
        <title>{fullyLoaded ? title : HorizontalPodAutoscalerModel.label}</title>
      </Helmet>
      {fullyLoaded || error ? (
        <>
          <HPAPageHeader
            kind={kind}
            limitWarning={workloadLoaded && validSupportedType ? getLimitWarning(data) : null}
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
