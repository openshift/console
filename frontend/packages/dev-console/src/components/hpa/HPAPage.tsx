import * as React from 'react';
import { Helmet } from 'react-helmet';
import { PageBody } from '@console/shared';
import { LoadingInline, PageComponentProps } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import HPAFormikForm from './HPAFormikForm';
import HPAPageHeader from './HPAPageHeader';
import { getLimitWarning, VALID_HPA_TARGET_KINDS } from './hpa-utils';

const HPAPage: React.FC<PageComponentProps> = (props) => {
  const {
    match: {
      params: { ns, kind, name },
    },
  } = props;

  const resource = React.useMemo(
    () => ({
      kind,
      namespace: ns,
      name,
    }),
    [kind, ns, name],
  );
  const [data, loaded, loadError] = useK8sWatchResource<K8sResourceKind>(resource);

  const validSupportedType = VALID_HPA_TARGET_KINDS.includes(kind);
  const title = `Add ${HorizontalPodAutoscalerModel.label}`;
  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light} hideApplications>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageBody flexLayout>
        <HPAPageHeader
          kind={kind}
          limitWarning={loaded && validSupportedType ? getLimitWarning(data) : null}
          loadError={loadError ? loadError.message : null}
          name={name}
          title={title}
          validSupportedType={validSupportedType}
        />
        {!loadError && validSupportedType && (
          <>{loaded ? <HPAFormikForm targetResource={data} /> : <LoadingInline />}</>
        )}
      </PageBody>
    </NamespacedPage>
  );
};

export default HPAPage;
