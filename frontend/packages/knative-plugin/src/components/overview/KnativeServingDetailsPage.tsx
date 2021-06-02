import * as React from 'react';
import { breadcrumbsForGlobalConfig } from '@console/internal/components/cluster-settings/global-config';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { K8sResourceKindReference, referenceForModel } from '@console/internal/module/k8s';
import { KnativeServingModel } from '../../models';

const knativeServingReference: K8sResourceKindReference = referenceForModel(KnativeServingModel);

const KnativeServingDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
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
