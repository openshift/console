import * as React from 'react';
import { referenceForModel, K8sResourceKindReference } from '@console/internal/module/k8s';
import { DetailsPage } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import { NetworkAttachmentDefinitionModel } from '../..';
import { NetworkAttachmentDefinitionDetails } from './NetworkAttachmentDefinitionDetails';

const menuActions = [...Kebab.factory.common];

export const NetworkAttachmentDefinitionsDetailsPage: React.FC<NetworkAttachmentDefinitionsDetailPageProps> = (
  props,
) => {
  const overviewPage = {
    href: '', // default landing page
    name: 'Details',
    component: NetworkAttachmentDefinitionDetails,
  };

  const pages = [overviewPage, navFactory.editYaml()];

  return (
    <DetailsPage
      {...props}
      pages={pages}
      kind={referenceForModel(NetworkAttachmentDefinitionModel)}
      menuActions={menuActions}
    />
  );
};

type NetworkAttachmentDefinitionsDetailPageProps = {
  name: string;
  namespace: string;
  kind: K8sResourceKindReference;
  match: any;
};

export default NetworkAttachmentDefinitionsDetailsPage;
