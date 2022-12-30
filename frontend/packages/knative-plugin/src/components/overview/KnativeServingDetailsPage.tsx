import * as React from 'react';
import { breadcrumbsForGlobalConfig } from '@console/internal/components/cluster-settings/global-config';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { K8sResourceKindReference, referenceForModel } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { KnativeServingModelV1Alpha1, KnativeServingModel } from '../../models';

const KnativeServingDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const [model] = useK8sModel(props.kind);

  // Added the check for apiVersion as apiversion `v1alpha1` is deprecated with Serverless operator 1.26 and get removed in 1.27 and `v1beta1` is supported
  const knativeServingReference: K8sResourceKindReference =
    model.apiVersion === 'v1alpha1'
      ? referenceForModel(KnativeServingModelV1Alpha1)
      : referenceForModel(KnativeServingModel);
  const pages = [navFactory.details(DetailsForKind(props.kind)), navFactory.editYaml()];

  return (
    <DetailsPage
      {...props}
      kind={knativeServingReference}
      pages={pages}
      breadcrumbsFor={() => breadcrumbsForGlobalConfig(KnativeServingModel.label, props.match.url)}
    />
  );
};

export default KnativeServingDetailsPage;
