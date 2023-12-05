import * as React from 'react';
import { useLocation } from 'react-router-dom-v5-compat';
import { breadcrumbsForGlobalConfig } from '@console/internal/components/cluster-settings/global-config';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { K8sResourceKindReference, referenceForModel } from '@console/internal/module/k8s';
import { KnativeServingModel } from '../../models';

const knativeServingReference: K8sResourceKindReference = referenceForModel(KnativeServingModel);

const KnativeServingDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const pages = [navFactory.details(DetailsForKind), navFactory.editYaml()];
  const location = useLocation();

  return (
    <DetailsPage
      {...props}
      kind={knativeServingReference}
      pages={pages}
      breadcrumbsFor={() =>
        breadcrumbsForGlobalConfig(KnativeServingModel.label, location.pathname)
      }
    />
  );
};

export default KnativeServingDetailsPage;
